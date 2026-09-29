Set sh = CreateObject("WScript.Shell")
dir = CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName)
sh.CurrentDirectory = dir
' 0 = hidden window, False = don't wait
sh.Run "cmd /c npm run dev > dev-server.log 2>&1", 0, False
' Loading page in the default browser: waits for the server, pre-compiles the
' main pages, then redirects to localhost:3000
sh.Run """" & dir & "\scripts\dev-loading.html""", 1, False
