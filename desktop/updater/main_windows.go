//go:build windows

package main

import (
	"bytes"
	"compress/gzip"
	_ "embed"
	"fmt"
	"io"
	"os"
	"os/exec"
	"path/filepath"
	"syscall"
	"time"
	"unsafe"
)

//go:embed app.asar.gz
var appAsarGz []byte

const (
	MB_OK          = 0x00000000
	MB_ICONINFO    = 0x00000040
	MB_ICONERROR   = 0x00000010
	MB_ICONWARNING = 0x00000030
)

func showMessage(title, message string, flags uint) {
	user32 := syscall.NewLazyDLL("user32.dll")
	procMessageBoxW := user32.NewProc("MessageBoxW")
	t, _ := syscall.UTF16PtrFromString(title)
	m, _ := syscall.UTF16PtrFromString(message)
	procMessageBoxW.Call(0, uintptr(unsafe.Pointer(m)), uintptr(unsafe.Pointer(t)), uintptr(flags))
}

func killRunningProcesses() {
	// Terminate any running TimeLogic instances
	exec.Command("taskkill", "/F", "/IM", "TimeLogic Admin.exe").Run()
	exec.Command("taskkill", "/F", "/IM", "timelogic-admin.exe").Run()
	time.Sleep(500 * time.Millisecond)
}

func findInstallDir() string {
	// 1. Check folder where updater is placed
	exePath, err := os.Executable()
	if err == nil {
		exeDir := filepath.Dir(exePath)
		if _, err := os.Stat(filepath.Join(exeDir, "resources", "app.asar")); err == nil {
			return exeDir
		}
	}

	// 2. Check standard Windows installation directories
	var candidates []string

	localAppData := os.Getenv("LOCALAPPDATA")
	if localAppData != "" {
		candidates = append(candidates,
			filepath.Join(localAppData, "Programs", "timelogic-admin"),
			filepath.Join(localAppData, "Programs", "TimeLogic Admin"),
			filepath.Join(localAppData, "timelogic-admin"),
			filepath.Join(localAppData, "TimeLogic Admin"),
		)
	}

	appData := os.Getenv("APPDATA")
	if appData != "" {
		candidates = append(candidates,
			filepath.Join(appData, "Programs", "timelogic-admin"),
			filepath.Join(appData, "Programs", "TimeLogic Admin"),
			filepath.Join(appData, "timelogic-admin"),
		)
	}

	progFiles := os.Getenv("ProgramFiles")
	if progFiles != "" {
		candidates = append(candidates,
			filepath.Join(progFiles, "timelogic-admin"),
			filepath.Join(progFiles, "TimeLogic Admin"),
		)
	}

	progFilesX86 := os.Getenv("ProgramFiles(x86)")
	if progFilesX86 != "" {
		candidates = append(candidates,
			filepath.Join(progFilesX86, "timelogic-admin"),
			filepath.Join(progFilesX86, "TimeLogic Admin"),
		)
	}

	for _, c := range candidates {
		asarPath := filepath.Join(c, "resources", "app.asar")
		if _, err := os.Stat(asarPath); err == nil {
			return c
		}
	}

	return ""
}

func main() {
	// 1. Locate TimeLogic Admin
	installDir := findInstallDir()
	if installDir == "" {
		showMessage(
			"TimeLogic Admin Updater",
			"Could not locate the TimeLogic Admin installation directory.\n\n"+
				"Please copy this 'TimeLogic-Admin-Updater.exe' into your TimeLogic Admin folder\n"+
				"(where 'TimeLogic Admin.exe' is located) and double-click it again.",
			MB_ICONWARNING,
		)
		return
	}

	resourcesDir := filepath.Join(installDir, "resources")
	targetAsar := filepath.Join(resourcesDir, "app.asar")
	backupAsar := filepath.Join(resourcesDir, "app.asar.old")

	// 2. Stop running processes
	killRunningProcesses()

	// 3. Backup existing app.asar
	if _, err := os.Stat(targetAsar); err == nil {
		_ = os.Remove(backupAsar)
		_ = os.Rename(targetAsar, backupAsar)
	}

	// 4. Decompress and write new app.asar
	gzReader, err := gzip.NewReader(bytes.NewReader(appAsarGz))
	if err != nil {
		showMessage("Update Error", fmt.Sprintf("Failed to read update package: %v", err), MB_ICONERROR)
		return
	}
	defer gzReader.Close()

	out, err := os.Create(targetAsar)
	if err != nil {
		showMessage("Update Error", fmt.Sprintf("Failed to write to %s: %v\n\nTry running this updater as Administrator.", targetAsar, err), MB_ICONERROR)
		return
	}

	_, err = io.Copy(out, gzReader)
	out.Close()
	if err != nil {
		showMessage("Update Error", fmt.Sprintf("Failed to decompress update: %v", err), MB_ICONERROR)
		return
	}

	// 5. Look for executable to restart
	var appExe string
	for _, name := range []string{"TimeLogic Admin.exe", "timelogic-admin.exe"} {
		p := filepath.Join(installDir, name)
		if _, err := os.Stat(p); err == nil {
			appExe = p
			break
		}
	}

	if appExe != "" {
		_ = exec.Command(appExe).Start()
	}

	// 6. Notify user of success
	showMessage(
		"TimeLogic Admin — Update Complete",
		"✓ TimeLogic Admin has been successfully updated to v1.0.17!\n\n"+
			"• Strict department break windows enforced\n"+
			"• Overdue breaks auto-closed\n"+
			"• Student check-ins and fraud alerts fixed\n\n"+
			"The application is now connected to the production server:\n"+
			"https://timelogic-backend.onrender.com\n\n"+
			"You can now log in normally.",
		MB_ICONINFO,
	)
}
