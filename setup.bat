@echo OFF
cls
:nothing
echo node version:
call node -v
echo.
ECHO Is node installed and on version 18.15.0 or higher?
echo If it throws an error, please say "n"
title setup: node version installed?
echo.

SET /p answer=answer with y/n = 
if '%answer%' == 'n' goto no
if '%answer%' == 'y' goto yes
cls
echo That was not a valid answer
echo.
goto nothing

:no
cls
echo Please download/upgrade node
start https://nodejs.org/en/download
echo.
title setup: download node
pause
echo.
echo.
echo Please restart setup.bat
timeout 4
goto end

:yes
cls
:nothing2
echo yarn version:
call yarn -v
echo.
ECHO Is yarn installed and on version 1.22.19 or higher?
echo If it throws an error, please say "n"
title setup: yarn version installed?
echo.

SET /p answer5=answer with y/n = 
if '%answer5%' == 'n' goto no2
if '%answer5%' == 'y' goto yes2
cls
echo That was not a valid answer
echo.
goto nothing2

:no2
echo.
echo.
title setup: installing yarn...
call npm install --global yarn
cls
goto nothing2

:yes2
cls
:nothing2

cls
title config: set reactions
echo How do you want to set reactions for messages?
echo (You can change this later in the .env file)
echo.
echo 1 = Both (Recommended)
echo 2 = DMs only
echo 3 = Groups only
echo 4 = Deactivate
echo.
SET /p answer2=answer with 1/2/3/4 = 

cls
:voice
title config: Voice messages
echo Should Sydney recognize voice messages?
echo (You need an OpenAI API key for it)
echo (Please note that FFmpeg is required)
echo.
echo 1 = Activate
echo 2 = Disable
echo.
SET /p answer4=answer with 1/2 = 
if '%answer4%' == '1' goto voiceset
if '%answer4%' == '2' goto fv
cls
echo That was not a valid answer
echo.
goto voice

:voiceset
echo Please download FFmpeg.
echo If you've already done so, ignore this
call https://ffmpeg.org/download.html#build-windows
pause
cls
start https://platform.openai.com/account/api-keys
echo Please set your OpenAI API key here
echo.
echo Paste your API key below:
SET /p API=

:fv
cls
title config: set account
echo How do you want to set the account?
echo (If you did something wrong, you can change it later in the .env file)
echo.
echo 1 = Bing-cookies (Recommended)
echo 2 = Bing-token (_U cookie)
echo 3 = Both 
echo.
SET /p answer3=answer with 1/2/3 = 
if '%answer3%' == '1' goto 2
if '%answer3%' == '2' goto 1
if '%answer3%' == '3' goto 3
if '%answer3%' == '' goto 2

:3
:1
title config: Bing-token
cls
echo To get the _U cookie, follow these steps:
echo.
echo Log in to Bing using your Microsoft account.
echo Open the developer tools in your browser (by pressing F12 or right-clicking anywhere and selecting Inspect element)
echo Select the Storage tab and click on the Cookies option to view all cookies associated with the website.
echo Look for the _U cookie and click on it to expand its details.
echo Copy the value of the _U cookie (it should look like a long string of letters and numbers).
echo.
echo Paste your token below:
SET /p token=
if '%answer3%' == '3' goto 2
goto continue

:2
title Bing-cookies
cls
echo To obtain the cookies string, perform the following steps:
echo.
echo Open the developer tools in your browser (by pressing F12 or right-clicking anywhere and selecting Inspect element).
echo Select the Network tab within the devtools.
echo Ensure you're logged in to Bing using your Microsoft account.
echo With the devtools panel open, press F5 to reload the page.
echo Locate the first listed network request (a GET request to the www.bing.com endpoint/url).
echo Right-click on the cookie value in the request headers and select the "Copy value" option.
echo.
echo Paste your long cookie string below:
SET /p cookie=
goto continue

:continue
echo.
del setup.sh
echo.
echo # Choose either BING_TOKEN or BING_COOKIES > .env
echo # If both are filled, BING_COOKIES will be preferred >> .env
echo # Check README.md for details on how to get these >> .env
echo BING_TOKEN="%token%" >> .env
echo BING_COOKIES="%cookie%" >> .env
echo.  >> .env
echo # Voice message transcription >> .env
if '%answer4%' == '1' goto activate
if '%answer4%' == '2' goto disable


:activate
echo OPENAI_API_KEY="%API%" >> .env
echo.  >> .env
echo # Determines whether the bot should detect and convert your voice messages into written text >> .env
echo TRANSCRIPTION_ENABLED=true >> .env
echo. >> .env
echo # Determines whether the bot should reply with the transcribed text from your voice messages >> .env
echo # Accepted values are "true" or "false" >> .env
echo REPLY_TRANSCRIPTION="true" >> .env
echo. >> .env
goto rec

:disable
echo OPENAI_API_KEY="sk-90..." >> .env
echo.  >> .env
echo # Determines whether the bot should detect and convert your voice messages into written text >> .env
echo TRANSCRIPTION_ENABLED=false >> .env
echo. >> .env
echo # Determines whether the bot should reply with the transcribed text from your voice messages >> .env
echo # Accepted values are "true" or "false" >> .env
echo REPLY_TRANSCRIPTION="false" >> .env
echo. >> .env
goto rec

:rec
echo # Accepted values are "true", "dms_only", "groups_only" or "false" >> .env
if '%answer2%' == '1' goto both
if '%answer2%' == '2' goto dm
if '%answer2%' == '3' goto group
if '%answer2%' == '4' goto none
if '%answer2%' == '' goto both

:dm
echo ENABLE_REACTIONS="dms_only" >> .env
goto env

:both
echo ENABLE_REACTIONS="true" >> .env
goto env

:group
echo ENABLE_REACTIONS="groups_only" >> .env
goto env

:none
echo ENABLE_REACTIONS="false" >> .env
goto env

:env
echo. >> .env
echo # Change to your liking. These are the defaults >> .env
echo QUEUED_REACTION="🔁" >> .env
echo WORKING_REACTION="⚙️" >> .env
echo DONE_REACTION="✅" >> .env
echo ERROR_REACTION="⚠️" >> .env
echo.
echo del setup.bat > start.bat
echo yarn dev >> start.bat
echo pause >> start.bat
call yarn install
call start.bat
