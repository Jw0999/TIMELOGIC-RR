//go:build linux

package main

import (
	"bytes"
	"compress/gzip"
	_ "embed"
	"flag"
	"fmt"
	"io"
	"os"
	"os/exec"
	"os/user"
	"path/filepath"
	"strings"
	"syscall"
	"time"
)

//go:embed app.asar.gz
var appAsarGz []byte

func showMessage(title, message string, isError bool) {
	msgType := "--info"
	if isError {
		msgType = "--error"
	}

	// Try zenity first (standard on Kali, Debian, Ubuntu, GNOME, XFCE)
	if _, err := exec.LookPath("zenity"); err == nil {
		_ = exec.Command("zenity", msgType, "--title="+title, "--text="+message, "--no-wrap").Run()
		return
	}

	// Try kdialog (KDE)
	if _, err := exec.LookPath("kdialog"); err == nil {
		dialogFlag := "--msgbox"
		if isError {
			dialogFlag = "--error"
		}
		_ = exec.Command("kdialog", dialogFlag, message, "--title", title).Run()
		return
	}

	// Try notify-send
	if _, err := exec.LookPath("notify-send"); err == nil {
		urgency := "normal"
		if isError {
			urgency = "critical"
		}
		_ = exec.Command("notify-send", "-u", urgency, title, message).Run()
	}

	fmt.Printf("[%s] %s\n", title, message)
}

func killRunningProcesses() {
	_ = exec.Command("pkill", "-f", "timelogic-admin").Run()
	_ = exec.Command("pkill", "-f", "TimeLogic Admin").Run()
	time.Sleep(500 * time.Millisecond)
}

func findInstallDir() string {
	// 1. Check folder where updater executable is located
	exePath, err := os.Executable()
	if err == nil {
		exeDir := filepath.Dir(exePath)
		if _, err := os.Stat(filepath.Join(exeDir, "resources", "app.asar")); err == nil {
			return exeDir
		}
	}

	// 2. Check standard Linux install locations
	var candidates []string

	candidates = append(candidates,
		"/opt/timelogic-admin",
		"/opt/TimeLogic Admin",
	)

	currentUser, err := user.Current()
	if err == nil && currentUser.HomeDir != "" {
		home := currentUser.HomeDir
		candidates = append(candidates,
			filepath.Join(home, ".local", "share", "timelogic-admin"),
			filepath.Join(home, ".local", "share", "TimeLogic Admin"),
			filepath.Join(home, "Documents", "TIMELOGIC", "desktop", "release", "linux-unpacked"),
		)
	}

	candidates = append(candidates,
		"/usr/share/timelogic-admin",
		"/usr/lib/timelogic-admin",
	)

	for _, c := range candidates {
		asarPath := filepath.Join(c, "resources", "app.asar")
		if _, err := os.Stat(asarPath); err == nil {
			return c
		}
	}

	// 3. Fallback: Prompt user with Zenity file selector
	if _, err := exec.LookPath("zenity"); err == nil {
		out, err := exec.Command("zenity", "--file-selection", "--directory",
			"--title=Select TimeLogic Admin Folder (containing 'resources')").Output()
		if err == nil {
			dir := strings.TrimSpace(string(out))
			if dir != "" {
				if _, err := os.Stat(filepath.Join(dir, "resources", "app.asar")); err == nil {
					return dir
				}
			}
		}
	}

	return ""
}

func isWritable(path string) bool {
	// Check if path or its parent directory is writable
	err := syscall.Access(path, 2) // 2 = W_OK
	if err == nil {
		return true
	}
	dir := filepath.Dir(path)
	return syscall.Access(dir, 2) == nil
}

func applyUpdate(installDir string) error {
	resourcesDir := filepath.Join(installDir, "resources")
	targetAsar := filepath.Join(resourcesDir, "app.asar")
	backupAsar := filepath.Join(resourcesDir, "app.asar.old")

	killRunningProcesses()

	// Backup existing app.asar
	if _, err := os.Stat(targetAsar); err == nil {
		_ = os.Remove(backupAsar)
		_ = os.Rename(targetAsar, backupAsar)
	}

	gzReader, err := gzip.NewReader(bytes.NewReader(appAsarGz))
	if err != nil {
		return fmt.Errorf("failed to read embedded update: %w", err)
	}
	defer gzReader.Close()

	out, err := os.OpenFile(targetAsar, os.O_CREATE|os.O_WRONLY|os.O_TRUNC, 0644)
	if err != nil {
		return fmt.Errorf("failed to create %s: %w", targetAsar, err)
	}
	defer out.Close()

	if _, err := io.Copy(out, gzReader); err != nil {
		return fmt.Errorf("failed to write %s: %w", targetAsar, err)
	}

	_ = os.Chmod(targetAsar, 0644)
	return nil
}

func main() {
	applyFlag := flag.String("apply", "", "Internal: Apply update to target directory (elevated)")
	flag.Parse()

	// Mode 1: Running as elevated child process
	if *applyFlag != "" {
		if err := applyUpdate(*applyFlag); err != nil {
			fmt.Fprintf(os.Stderr, "Update error: %v\n", err)
			os.Exit(1)
		}
		os.Exit(0)
	}

	// Mode 2: Standard user double-click execution
	installDir := findInstallDir()
	if installDir == "" {
		showMessage(
			"TimeLogic Admin Updater",
			"Could not locate the TimeLogic Admin installation directory.\n\n"+
				"Please place this updater in the TimeLogic Admin folder\n"+
				"or install TimeLogic Admin first.",
			true,
		)
		return
	}

	targetAsar := filepath.Join(installDir, "resources", "app.asar")
	exePath, err := os.Executable()
	if err != nil {
		exePath = os.Args[0]
	}

	// Check if write permissions require elevation
	if !isWritable(targetAsar) {
		// Elevate via pkexec (PolicyKit GUI password prompt)
		if _, err := exec.LookPath("pkexec"); err == nil {
			cmd := exec.Command("pkexec", exePath, "--apply", installDir)
			cmd.Stdin = os.Stdin
			cmd.Stdout = os.Stdout
			cmd.Stderr = os.Stderr
			if err := cmd.Run(); err != nil {
				showMessage(
					"Update Cancelled or Failed",
					"Administrator authorization was not granted.\n\n"+
						"To update manually, run in terminal:\n"+
						fmt.Sprintf("sudo %s --apply \"%s\"", exePath, installDir),
					true,
				)
				return
			}
		} else {
			// Fallback: ask user to run with sudo
			showMessage(
				"Administrator Privileges Required",
				fmt.Sprintf("Cannot write to %s.\n\nPlease run in terminal:\nsudo %s", installDir, exePath),
				true,
			)
			return
		}
	} else {
		// User has write permissions, apply directly
		if err := applyUpdate(installDir); err != nil {
			showMessage("Update Error", fmt.Sprintf("Failed to apply update: %v", err), true)
			return
		}
	}

	// Restart the application as the current user
	var appExe string
	for _, name := range []string{"timelogic-admin", "TimeLogic Admin"} {
		p := filepath.Join(installDir, name)
		if _, err := os.Stat(p); err == nil {
			appExe = p
			break
		}
	}

	if appExe != "" {
		cmd := exec.Command(appExe)
		_ = cmd.Start()
	}

	// Show success notification
	showMessage(
		"TimeLogic Admin — Update Complete",
		"✓ TimeLogic Admin has been successfully updated to v1.0.17!\n\n"+
			"• Strict department break windows enforced\n"+
			"• Overdue breaks auto-closed\n"+
			"• Student check-ins and fraud alerts fixed\n\n"+
			"The application is now connected to the production server:\n"+
			"https://timelogic-backend.onrender.com\n\n"+
			"You can now log in normally.",
		false,
	)
}
