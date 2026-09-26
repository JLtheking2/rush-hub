Set sh = CreateObject("WScript.Shell")
sh.CurrentDirectory = CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName)
' 0 = hidden window, False = don't wait
sh.Run "cmd /c npm run dev > dev-server.log 2>&1", 0, False
