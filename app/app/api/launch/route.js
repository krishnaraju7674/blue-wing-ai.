import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const SCRIPTS = {
  'demo': 'start notepad && timeout /t 2 && start calc && timeout /t 2 && start mspaint',
  'productivity': 'start chrome "https://gmail.com" && start chrome "https://calendar.google.com" && start code',
  'secure': 'taskkill /IM chrome.exe /F && taskkill /IM notepad.exe /F && start powershell',
};

function hash() {
  return `BW-${Math.random().toString(36).substring(2,6).toUpperCase()}`;
}

// ── Application Registry ──
const APPS = {
  // System
  'notepad': { open: 'start notepad', close: 'taskkill /IM notepad.exe /F', name: 'Notepad' },
  'calculator': { open: 'start calc', close: 'taskkill /IM Calculator.exe /F', name: 'Calculator' },
  'calc': { open: 'start calc', close: 'taskkill /IM Calculator.exe /F', name: 'Calculator' },
  'paint': { open: 'start mspaint', close: 'taskkill /IM mspaint.exe /F', name: 'Paint' },
  'explorer': { open: 'start explorer', close: 'taskkill /IM explorer.exe /F', name: 'File Explorer' },
  'file explorer': { open: 'start explorer', close: 'taskkill /IM explorer.exe /F', name: 'File Explorer' },
  'files': { open: 'start explorer', close: 'taskkill /IM explorer.exe /F', name: 'File Explorer' },
  'terminal': { open: 'start cmd', close: 'taskkill /IM cmd.exe /F', name: 'Terminal' },
  'cmd': { open: 'start cmd', close: 'taskkill /IM cmd.exe /F', name: 'Terminal' },
  'command prompt': { open: 'start cmd', close: 'taskkill /IM cmd.exe /F', name: 'Terminal' },
  'powershell': { open: 'start powershell', close: 'taskkill /IM powershell.exe /F', name: 'PowerShell' },
  'settings': { open: 'start ms-settings:', close: 'taskkill /IM SystemSettings.exe /F', name: 'Settings' },
  'task manager': { open: 'start taskmgr', close: 'taskkill /IM Taskmgr.exe /F', name: 'Task Manager' },
  'snipping tool': { open: 'start snippingtool', close: 'taskkill /IM SnippingTool.exe /F', name: 'Snipping Tool' },
  'screenshot': { open: 'start snippingtool', close: 'taskkill /IM SnippingTool.exe /F', name: 'Snipping Tool' },
  'snip': { open: 'start snippingtool', close: 'taskkill /IM SnippingTool.exe /F', name: 'Snipping Tool' },
  'clock': { open: 'start ms-clock:', close: 'taskkill /IM Time.exe /F', name: 'Clock' },
  'alarms': { open: 'start ms-clock:', close: 'taskkill /IM Time.exe /F', name: 'Alarms & Clock' },
  'camera': { open: 'start microsoft.windows.camera:', close: 'taskkill /IM WindowsCamera.exe /F', name: 'Camera' },
  'photos': { open: 'start ms-photos:', close: 'taskkill /IM Microsoft.Photos.exe /F', name: 'Photos' },
  'store': { open: 'start ms-windows-store:', close: 'taskkill /IM WinStore.App.exe /F', name: 'Microsoft Store' },
  'microsoft store': { open: 'start ms-windows-store:', close: 'taskkill /IM WinStore.App.exe /F', name: 'Microsoft Store' },
  'maps': { open: 'start bingmaps:', close: 'taskkill /IM Maps.exe /F', name: 'Maps' },
  'mail': { open: 'start outlookmail:', close: 'taskkill /IM HxOutlook.exe /F', name: 'Mail' },
  'weather': { open: 'start bingweather:', close: 'taskkill /IM Weather.exe /F', name: 'Weather' },
  'feedback': { open: 'start feedback-hub:', close: 'taskkill /IM FeedbackHub.exe /F', name: 'Feedback Hub' },
  'control panel': { open: 'start control', close: 'taskkill /IM control.exe /F', name: 'Control Panel' },
  'device manager': { open: 'start devmgmt.msc', close: 'taskkill /IM mmc.exe /F', name: 'Device Manager' },
  'disk management': { open: 'start diskmgmt.msc', close: 'taskkill /IM mmc.exe /F', name: 'Disk Management' },
  'services': { open: 'start services.msc', close: 'taskkill /IM mmc.exe /F', name: 'Services' },
  'event viewer': { open: 'start eventvwr.msc', close: 'taskkill /IM mmc.exe /F', name: 'Event Viewer' },
  'registry': { open: 'start regedit', close: 'taskkill /IM regedit.exe /F', name: 'Registry Editor' },
  'regedit': { open: 'start regedit', close: 'taskkill /IM regedit.exe /F', name: 'Registry Editor' },
  'resource monitor': { open: 'start resmon', close: 'taskkill /IM resmon.exe /F', name: 'Resource Monitor' },
  'system info': { open: 'start msinfo32', close: 'taskkill /IM msinfo32.exe /F', name: 'System Information' },
  'remote desktop': { open: 'start mstsc', close: 'taskkill /IM mstsc.exe /F', name: 'Remote Desktop' },
  'magnifier': { open: 'start magnify', close: 'taskkill /IM Magnify.exe /F', name: 'Magnifier' },
  'narrator': { open: 'start narrator', close: 'taskkill /IM Narrator.exe /F', name: 'Narrator' },
  'on-screen keyboard': { open: 'start osk', close: 'taskkill /IM osk.exe /F', name: 'On-Screen Keyboard' },
  'wordpad': { open: 'start wordpad', close: 'taskkill /IM wordpad.exe /F', name: 'WordPad' },
  'character map': { open: 'start charmap', close: 'taskkill /IM charmap.exe /F', name: 'Character Map' },
  'sound recorder': { open: 'start soundrecorder:', close: 'taskkill /IM SoundRec.exe /F', name: 'Sound Recorder' },
  'recorder': { open: 'start soundrecorder:', close: 'taskkill /IM SoundRec.exe /F', name: 'Sound Recorder' },
  'xbox': { open: 'start xbox:', close: 'taskkill /IM XboxApp.exe /F', name: 'Xbox' },
  'game bar': { open: 'start xbox-gamebar:', close: 'taskkill /IM GameBar.exe /F', name: 'Xbox Game Bar' },
  'sticky notes': { open: 'start "Sticky Notes" shell:appsfolder\\Microsoft.MicrosoftStickyNotes_8wekyb3d8bbwe!App', close: 'taskkill /IM Microsoft.Notes.exe /F', name: 'Sticky Notes' },
  'tips': { open: 'start ms-get-started:', name: 'Tips' },
  'windows security': { open: 'start windowsdefender:', close: 'taskkill /IM SecurityHealth*.exe /F', name: 'Windows Security' },
  'defender': { open: 'start windowsdefender:', close: 'taskkill /IM SecurityHealth*.exe /F', name: 'Windows Security' },

  // Development
  'vscode': { open: 'start code', close: 'taskkill /IM Code.exe /F', name: 'VS Code' },
  'vs code': { open: 'start code', close: 'taskkill /IM Code.exe /F', name: 'VS Code' },
  'code': { open: 'start code', close: 'taskkill /IM Code.exe /F', name: 'VS Code' },
  'visual studio': { open: 'start devenv', close: 'taskkill /IM devenv.exe /F', name: 'Visual Studio' },
  'git bash': { open: 'start "" "C:\\Program Files\\Git\\git-bash.exe"', close: 'taskkill /IM git-bash.exe /F', name: 'Git Bash' },
  'postman': { open: 'start Postman', close: 'taskkill /IM Postman.exe /F', name: 'Postman' },
  'docker': { open: 'start "Docker" "C:\\Program Files\\Docker\\Docker\\Docker Desktop.exe"', close: 'taskkill /IM "Docker Desktop.exe" /F', name: 'Docker Desktop' },
  'android studio': { open: 'start studio64', close: 'taskkill /IM studio64.exe /F', name: 'Android Studio' },
  'intellij': { open: 'start idea64', close: 'taskkill /IM idea64.exe /F', name: 'IntelliJ IDEA' },
  'sublime': { open: 'start subl', close: 'taskkill /IM sublime_text.exe /F', name: 'Sublime Text' },
  'atom': { open: 'start atom', close: 'taskkill /IM atom.exe /F', name: 'Atom' },

  // Browsers
  'chrome': { open: 'start chrome', close: 'taskkill /IM chrome.exe /F', name: 'Chrome' },
  'google chrome': { open: 'start chrome', close: 'taskkill /IM chrome.exe /F', name: 'Chrome' },
  'edge': { open: 'start msedge', close: 'taskkill /IM msedge.exe /F', name: 'Edge' },
  'microsoft edge': { open: 'start msedge', close: 'taskkill /IM msedge.exe /F', name: 'Edge' },
  'firefox': { open: 'start firefox', close: 'taskkill /IM firefox.exe /F', name: 'Firefox' },
  'brave': { open: 'start brave', close: 'taskkill /IM brave.exe /F', name: 'Brave' },
  'opera': { open: 'start opera', close: 'taskkill /IM opera.exe /F', name: 'Opera' },
  'tor': { open: 'start "Tor" "C:\\Program Files\\Tor Browser\\Browser\\firefox.exe"', close: 'taskkill /IM firefox.exe /F', name: 'Tor Browser' },

  // Microsoft Office
  'word': { open: 'start winword', close: 'taskkill /IM WINWORD.EXE /F', name: 'Word' },
  'excel': { open: 'start excel', close: 'taskkill /IM EXCEL.EXE /F', name: 'Excel' },
  'powerpoint': { open: 'start powerpnt', close: 'taskkill /IM POWERPNT.EXE /F', name: 'PowerPoint' },
  'ppt': { open: 'start powerpnt', close: 'taskkill /IM POWERPNT.EXE /F', name: 'PowerPoint' },
  'outlook': { open: 'start outlook', close: 'taskkill /IM OUTLOOK.EXE /F', name: 'Outlook' },
  'access': { open: 'start msaccess', close: 'taskkill /IM MSACCESS.EXE /F', name: 'Access' },
  'onenote': { open: 'start onenote', close: 'taskkill /IM ONENOTE.EXE /F', name: 'OneNote' },
  'publisher': { open: 'start mspub', close: 'taskkill /IM MSPUB.EXE /F', name: 'Publisher' },

  // Media
  'vlc': { open: 'start vlc', close: 'taskkill /IM vlc.exe /F', name: 'VLC' },
  'media player': { open: 'start wmplayer', close: 'taskkill /IM wmplayer.exe /F', name: 'Media Player' },
  'spotify': { open: 'start spotify:', close: 'taskkill /IM Spotify.exe /F', name: 'Spotify' },
  'itunes': { open: 'start iTunes', close: 'taskkill /IM iTunes.exe /F', name: 'iTunes' },
  'audacity': { open: 'start audacity', close: 'taskkill /IM audacity.exe /F', name: 'Audacity' },
  'obs': { open: 'start obs64', close: 'taskkill /IM obs64.exe /F', name: 'OBS Studio' },
  'obs studio': { open: 'start obs64', close: 'taskkill /IM obs64.exe /F', name: 'OBS Studio' },

  // Communication
  'discord': { open: 'start discord:', close: 'taskkill /IM Discord.exe /F', name: 'Discord' },
  'slack': { open: 'start slack:', close: 'taskkill /IM slack.exe /F', name: 'Slack' },
  'teams': { open: 'start msteams:', close: 'taskkill /IM ms-teams.exe /F', name: 'Teams' },
  'microsoft teams': { open: 'start msteams:', close: 'taskkill /IM ms-teams.exe /F', name: 'Teams' },
  'whatsapp': { open: 'start whatsapp:', close: 'taskkill /IM WhatsApp.exe /F', name: 'WhatsApp' },
  'telegram': { open: 'start tg:', close: 'taskkill /IM Telegram.exe /F', name: 'Telegram' },
  'zoom': { open: 'start zoommtg:', close: 'taskkill /IM Zoom.exe /F', name: 'Zoom' },
  'skype': { open: 'start skype:', close: 'taskkill /IM Skype.exe /F', name: 'Skype' },

  // Creative
  'photoshop': { open: 'start photoshop', close: 'taskkill /IM Photoshop.exe /F', name: 'Photoshop' },
  'illustrator': { open: 'start illustrator', close: 'taskkill /IM Illustrator.exe /F', name: 'Illustrator' },
  'premiere': { open: 'start "Premiere" "C:\\Program Files\\Adobe\\Adobe Premiere Pro\\Adobe Premiere Pro.exe"', close: 'taskkill /IM "Adobe Premiere Pro.exe" /F', name: 'Premiere Pro' },
  'after effects': { open: 'start afterfx', close: 'taskkill /IM AfterFX.exe /F', name: 'After Effects' },
  'blender': { open: 'start blender', close: 'taskkill /IM blender.exe /F', name: 'Blender' },
  'gimp': { open: 'start gimp', close: 'taskkill /IM gimp-2.10.exe /F', name: 'GIMP' },

  // Gaming
  'steam': { open: 'start steam:', close: 'taskkill /IM steam.exe /F', name: 'Steam' },
  'epic games': { open: 'start com.epicgames.launcher:', close: 'taskkill /IM EpicGamesLauncher.exe /F', name: 'Epic Games' },
  'epic': { open: 'start com.epicgames.launcher:', close: 'taskkill /IM EpicGamesLauncher.exe /F', name: 'Epic Games' },
  'minecraft': { open: 'start minecraft:', close: 'taskkill /IM Minecraft.exe /F', name: 'Minecraft' },
  'roblox': { open: 'start roblox:', close: 'taskkill /IM RobloxPlayerBeta.exe /F', name: 'Roblox' },

  // Utilities
  'winrar': { open: 'start WinRAR', close: 'taskkill /IM WinRAR.exe /F', name: 'WinRAR' },
  '7zip': { open: 'start 7zFM', close: 'taskkill /IM 7zFM.exe /F', name: '7-Zip' },
  'ccleaner': { open: 'start CCleaner64', close: 'taskkill /IM CCleaner64.exe /F', name: 'CCleaner' },
  'anydesk': { open: 'start AnyDesk', close: 'taskkill /IM AnyDesk.exe /F', name: 'AnyDesk' },
  'teamviewer': { open: 'start TeamViewer', close: 'taskkill /IM TeamViewer.exe /F', name: 'TeamViewer' },

  // System & Power
  'shutdown': { open: 'shutdown /s /t 60', close: 'shutdown /a', name: 'Shutdown (1 min)' },
  'restart': { open: 'shutdown /r /t 60', close: 'shutdown /a', name: 'Restart (1 min)' },
  'lock': { open: 'rundll32.exe user32.dll,LockWorkStation', name: 'Lock PC' },
  'sleep': { open: 'rundll32.exe powrprof.dll,SetSuspendState 0,1,0', name: 'Sleep' },
  'volume up': { open: 'powershell -c "$obj = New-Object -ComObject WScript.Shell; $obj.SendKeys([char]175)"', name: 'Volume Up' },
  'volume down': { open: 'powershell -c "$obj = New-Object -ComObject WScript.Shell; $obj.SendKeys([char]174)"', name: 'Volume Down' },
  'mute': { open: 'powershell -c "$obj = New-Object -ComObject WScript.Shell; $obj.SendKeys([char]173)"', name: 'Mute' },
  'unmute': { open: 'powershell -c "$obj = New-Object -ComObject WScript.Shell; $obj.SendKeys([char]173)"', name: 'Unmute' },
  'brightness up': { open: 'powershell -c "$b = (Get-WmiObject -Namespace root/WMI -Class WmiMonitorBrightness).CurrentBrightness; $new = [Math]::Min($b + 10, 100); (Get-WmiObject -Namespace root/WMI -Class WmiMonitorBrightnessMethods).WmiSetBrightness(1, $new)"', name: 'Brightness Up' },
  'brightness down': { open: 'powershell -c "$b = (Get-WmiObject -Namespace root/WMI -Class WmiMonitorBrightness).CurrentBrightness; $new = [Math]::Max($b - 10, 0); (Get-WmiObject -Namespace root/WMI -Class WmiMonitorBrightnessMethods).WmiSetBrightness(1, $new)"', name: 'Brightness Down' },
  'brightness max': { open: 'powershell -c "(Get-WmiObject -Namespace root/WMI -Class WmiMonitorBrightnessMethods).WmiSetBrightness(1, 100)"', name: 'Brightness Max' },
  'brightness min': { open: 'powershell -c "(Get-WmiObject -Namespace root/WMI -Class WmiMonitorBrightnessMethods).WmiSetBrightness(1, 0)"', name: 'Brightness Min' },
  'wifi on': { open: 'netsh interface set interface "Wi-Fi" admin=enabled', name: 'WiFi On' },
  'wifi off': { open: 'netsh interface set interface "Wi-Fi" admin=disabled', name: 'WiFi Off' },
  'battery': { open: 'start ms-settings:batterysaver', name: 'Battery Settings' },
  'network': { open: 'start ms-settings:network', name: 'Network Settings' },
  'control panel': { open: 'start control', name: 'Control Panel' },
  'display settings': { open: 'start ms-settings:display', name: 'Display Settings' },
  'sound settings': { open: 'start ms-settings:sound', name: 'Sound Settings' },
  'add or remove programs': { open: 'start appwiz.cpl', name: 'Programs and Features' },
  'user accounts': { open: 'start netplwiz', name: 'User Accounts' },
  'date and time': { open: 'start timedate.cpl', name: 'Date and Time' },
  'system properties': { open: 'start sysdm.cpl', name: 'System Properties' },
  // Keyboard Control
  'keyboard': { open: 'powershell -c "$obj = New-Object -ComObject WScript.Shell; $obj.SendKeys(\'{KEYS}\')"', name: 'Keyboard Input' },
  // Chrome Tabs
  'new tab': { open: 'start chrome', name: 'New Chrome Tab' },
  'google search': { open: 'start chrome "https://www.google.com/search?q={QUERY}"', name: 'Google Search' },
};

const WEB_APPS = {
  // Search & General
  'google': 'https://www.google.com',
  'bing': 'https://www.bing.com',
  'duckduckgo': 'https://duckduckgo.com',
  'search': 'https://www.google.com/search?q=',
  'google search': 'https://www.google.com/search?q=',
  
  // Communication
  'gmail': 'https://mail.google.com',
  'outlook': 'https://outlook.live.com',
  'yahoo mail': 'https://mail.yahoo.com',
  'whatsapp': 'https://web.whatsapp.com',
  'whatsapp web': 'https://web.whatsapp.com',
  'telegram': 'https://web.telegram.org',
  'telegram web': 'https://web.telegram.org',
  'messenger': 'https://www.messenger.com',
  'discord': 'https://discord.com/app',
  'slack': 'https://app.slack.com',
  
  // Video & Entertainment
  'youtube': 'https://www.youtube.com',
  'netflix': 'https://www.netflix.com',
  'prime video': 'https://www.primevideo.com',
  'disney plus': 'https://www.disneyplus.com',
  'hulu': 'https://www.hulu.com',
  'hbo': 'https://www.max.com',
  'twitch': 'https://www.twitch.tv',
  'vimeo': 'https://vimeo.com',
  'daily motion': 'https://www.dailymotion.com',
  'crunchyroll': 'https://www.crunchyroll.com',
  'hotstar': 'https://www.hotstar.com',
  
  // Social Media
  'twitter': 'https://twitter.com',
  'x': 'https://x.com',
  'facebook': 'https://www.facebook.com',
  'instagram': 'https://www.instagram.com',
  'linkedin': 'https://www.linkedin.com',
  'reddit': 'https://www.reddit.com',
  'tiktok': 'https://www.tiktok.com',
  'snapchat': 'https://www.snapchat.com',
  'pinterest': 'https://www.pinterest.com',
  'tumblr': 'https://www.tumblr.com',
  'threads': 'https://www.threads.net',
  'quora': 'https://www.quora.com',
  
  // Shopping
  'amazon': 'https://www.amazon.com',
  'ebay': 'https://www.ebay.com',
  'walmart': 'https://www.walmart.com',
  'target': 'https://www.target.com',
  'best buy': 'https://www.bestbuy.com',
  'aliexpress': 'https://www.aliexpress.com',
  'flipkart': 'https://www.flipkart.com',
  'myntra': 'https://www.myntra.com',
  'etsy': 'https://www.etsy.com',
  'shopify': 'https://www.shopify.com',
  'nike': 'https://www.nike.com',
  'adidas': 'https://www.adidas.com',
  
  // Food & Delivery
  'swiggy': 'https://www.swiggy.com',
  'zomato': 'https://www.zomato.com',
  'uber eats': 'https://www.ubereats.com',
  'door dash': 'https://www.doordash.com',
  'grubhub': 'https://www.grubhub.com',
  'instacart': 'https://www.instacart.com',
  'food panda': 'https://www.foodpanda.com',
  
  // News & Info
  'news': 'https://news.google.com',
  'bbc': 'https://www.bbc.com/news',
  'cnn': 'https://www.cnn.com',
  'reuters': 'https://www.reuters.com',
  'nytimes': 'https://www.nytimes.com',
  'al jazeera': 'https://www.aljazeera.com',
  'wikipedia': 'https://www.wikipedia.org',
  'wiki': 'https://www.wikipedia.org',
  'medium': 'https://medium.com',
  'the verge': 'https://www.theverge.com',
  'techcrunch': 'https://techcrunch.com',
  
  // Finance & Crypto
  'yahoo finance': 'https://finance.yahoo.com',
  'bloomberg': 'https://www.bloomberg.com',
  'coinmarketcap': 'https://coinmarketcap.com',
  'coinbase': 'https://www.coinbase.com',
  'binance': 'https://www.binance.com',
  'tradingview': 'https://www.tradingview.com',
  'paypal': 'https://www.paypal.com',
  'paytm': 'https://paytm.com',
  'robinhood': 'https://robinhood.com',
  
  // Productivity & Cloud
  'drive': 'https://drive.google.com',
  'docs': 'https://docs.google.com',
  'sheets': 'https://sheets.google.com',
  'slides': 'https://slides.google.com',
  'photos': 'https://photos.google.com',
  'keep': 'https://keep.google.com',
  'calendar': 'https://calendar.google.com',
  'dropbox': 'https://www.dropbox.com',
  'notion': 'https://www.notion.so',
  'trello': 'https://trello.com',
  'asana': 'https://asana.com',
  'monday': 'https://monday.com',
  'evernote': 'https://evernote.com',
  'zoom': 'https://zoom.us',
  'figma': 'https://www.figma.com',
  'canva': 'https://www.canva.com',
  
  // AI Tools
  'chatgpt': 'https://chat.openai.com',
  'gemini': 'https://gemini.google.com',
  'claude': 'https://claude.ai',
  'perplexity': 'https://www.perplexity.ai',
  'midjourney': 'https://www.midjourney.com',
  'hugging face': 'https://huggingface.co',
  'elevenlabs': 'https://elevenlabs.io',
  
  // Education & Learning
  'coursera': 'https://www.coursera.org',
  'udemy': 'https://www.udemy.com',
  'edx': 'https://www.edx.org',
  'khan academy': 'https://www.khanacademy.org',
  'duolingo': 'https://www.duolingo.com',
  'codecademy': 'https://www.codecademy.com',
  'w3schools': 'https://www.w3schools.com',
  'mdn': 'https://developer.mozilla.org',
  
  // Travel & Local
  'maps': 'https://maps.google.com',
  'uber': 'https://www.uber.com',
  'ola': 'https://www.olacabs.com',
  'airbnb': 'https://www.airbnb.com',
  'booking.com': 'https://www.booking.com',
  'expedia': 'https://www.expedia.com',
  'tripadvisor': 'https://www.tripadvisor.com',
  'skyscanner': 'https://www.skyscanner.com',
  'weather': 'https://weather.com',
  
  // Dev Tools
  'github': 'https://github.com',
  'gitlab': 'https://gitlab.com',
  'bitbucket': 'https://bitbucket.org',
  'stackoverflow': 'https://stackoverflow.com',
  'npm': 'https://www.npmjs.com',
  'vercel': 'https://vercel.com',
  'netlify': 'https://netlify.com',
  'replit': 'https://replit.com',
  'leetcode': 'https://leetcode.com',
  'hackerrank': 'https://www.hackerrank.com',
  
  // Jobs
  'indeed': 'https://www.indeed.com',
  'glassdoor': 'https://www.glassdoor.com',
  'naukri': 'https://www.naukri.com',
};

export async function POST(req) {
  try {
    const { target, action } = await req.json();
    const t = target?.toLowerCase().trim();
    const isClose = action === 'close';

    // 1. Check Scripts first (Multi-step automation)
    if (SCRIPTS[t] && !isClose) {
      await execAsync(SCRIPTS[t]);
      return NextResponse.json({ 
        text: `Executing ${t.toUpperCase()} protocol. Systems responding, Sir.`, 
        hash: hash(), success: true 
      });
    }

    // 2. Check Keyboard commands
    if (t?.startsWith('keyboard')) {
      const key = t.replace('keyboard', '').trim();
      let psCommand = '';
      if (key === 'alt+tab') psCommand = '%{TAB}';
      else if (key === 'enter') psCommand = '{ENTER}';
      else if (key === 'space') psCommand = ' ';
      else if (key === 'win+d') psCommand = '#d';
      else if (key === 'alt+f4') psCommand = '%{F4}';
      
      if (psCommand) {
        const fullCmd = `powershell -Command "$wshell = New-Object -ComObject WScript.Shell; $wshell.SendKeys('${psCommand}')"`;
        await execAsync(fullCmd);
        return NextResponse.json({ text: `Simulated ${key.toUpperCase()}, Sir.`, hash: hash(), success: true });
      }
    }

    // 3. Check App Registry
    const app = APPS[t];
    if (app) {
      const cmd = isClose ? (app.close || `taskkill /IM ${t}.exe /F`) : app.open;
      await execAsync(cmd);
      return NextResponse.json({ 
        text: isClose ? `${app.name} terminated.` : `Launching ${app.name}, Sir.`, 
        hash: hash(), success: true 
      });
    }

    // 4. Web Fallback
    if (WEB_APPS[t] && !isClose) {
      return NextResponse.json({ text: `Directing to ${t.toUpperCase()}, Sir.`, hash: hash(), success: true, type: 'web', url: WEB_APPS[t] });
    }

    // 5. Direct Execution Fallback (God Mode)
    if (!isClose) {
      try {
        await execAsync(`start ${t}`);
        return NextResponse.json({ text: `Manual override: Initializing ${t}, Sir.`, hash: hash(), success: true });
      } catch {
        return NextResponse.json({ text: `I couldn't find ${t} in my registry or system path, Sir.`, hash: hash(), success: false });
      }
    }

    return NextResponse.json({ text: `Protocol for ${t} is not defined, Sir.`, hash: hash(), success: false });
  } catch (error) {
    console.error('Launch Error:', error);
    return NextResponse.json({ text: `Communication failure: ${error.message}`, hash: hash(), success: false });
  }
}


