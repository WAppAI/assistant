#!/bin/bash

clear
#nothing
echo "Node version:"
node -v
echo

echo "Is Node installed and on version 18.15.0 or higher?"
echo "If it throws an error, please answer 'n'"
echo

read -p "Answer with y/n: " answer
if [[ "$answer" == "n" || "$answer" == "N" ]]; then
    clear
    echo "Please install Node.js"
    sudo apt update
    sudo apt upgrade
    sudo apt install curl
    sudo curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash
    sudo source ~/.bashrc
    sudo nvm  install v18.15.0
    clear
    echo "Please restart the setup and the terminal. If you still get an error, try installing the node manually"
    exit 0
fi

clear
#nothing2
echo "Yarn version:"
yarn -v
echo

echo "Is Yarn installed and on version 1.22.19 or higher?"
echo "If it throws an error, please answer 'n'"
echo

read -p "Answer with y/n: " answer5
if [[ "$answer5" == "n" || "$answer5" == "N" ]]; then
    echo
    echo
    echo "setup: installing Yarn..."
    npm install --global yarn
    clear
    echo "Yarn installed successfully. Proceeding to check version..."
    echo
    echo "Yarn version:"
    yarn -v
    echo

    echo "Is Yarn on version 1.22.19 or higher now?"
    echo "If it throws an error, please answer 'n'"
    echo

    read -p "Answer with y/n: " answer6
    if [[ "$answer6" == "n" || "$answer6" == "N" ]]; then
        echo
        echo "Yarn version is still not on 1.22.19 or higher. Please update Yarn manually."
        exit 0
    fi
fi


clear
#config: set reactions
echo "How do you want to set reactions for messages?"
echo "(You can change this later in the .env file)"
echo
echo "1 = Both (Recommended)"
echo "2 = DMs only"
echo "3 = Groups only"
echo "4 = Deactivate"
echo
read -p "Answer with 1/2/3/4: " answer2

clear
#config: set account
echo "How do you want to set the account?"
echo "(If you did something wrong, you can change it later in the .env file)"
echo
echo "1 = Bing-cookies (Recommended)"
echo "2 = Bing-token (_U cookie)"
echo "3 = Both"
echo
read -p "Answer with 1/2/3: " answer3

if [[ "$answer3" == "2" ]]; then
    #config: Bing-token
    clear
    echo "To get the _U cookie, follow these steps:"
    echo
    echo "1. Log in to Bing using your Microsoft account."
    echo "2. Open the developer tools in your browser (by pressing F12 or right-clicking anywhere and selecting 'Inspect element')."
    echo "3. Select the Storage tab and click on the Cookies option to view all cookies associated with the website."
    echo "4. Look for the _U cookie and click on it to expand its details."
    echo "5. Copy the value of the _U cookie (it should look like a long string of letters and numbers)."
    echo
    echo "Paste your token below:"
    read -r token

elif [[ "$answer3" == "1" ]]; then
    #config: Bing-cookies
    clear
    echo "To obtain the cookies string, perform the following steps:"
    echo
    echo "1. Open the developer tools in your browser (by pressing F12 or right-clicking anywhere and selecting 'Inspect element')."
    echo "2. Select the Network tab within the devtools."
    echo "3. Ensure you're logged in to Bing using your Microsoft account."
    echo "4. With the devtools panel open, press F5 to reload the page."
    echo "5. Locate the first listed network request (a GET request to the www.bing.com endpoint/url)."
    echo "6. Right-click on the cookie value in the request headers and select the 'Copy value' option."
    echo
    echo "Paste your long cookie string below:"
    read -r cookie

elif [[ "$answer3" == "3" ]]; then
    #config: Bing-token-cookie
    clear
    echo "To get the _U cookie, follow these steps:"
    echo
    echo "1. Log in to Bing using your Microsoft account."
    echo "2. Open the developer tools in your browser (by pressing F12 or right-clicking anywhere and selecting 'Inspect element')."
    echo "3. Select the Storage tab and click on the Cookies option to view all cookies associated with the website."
    echo "4. Look for the _U cookie and click on it to expand its details."
    echo "5. Copy the value of the _U cookie (it should look like a long string of letters and numbers)."
    echo
    echo "Paste your token below:"
    read -r token
    clear
    echo "To obtain the cookies string, perform the following steps:"
    echo
    echo "1. Open the developer tools in your browser (by pressing F12 or right-clicking anywhere and selecting 'Inspect element')."
    echo "2. Select the Network tab within the devtools."
    echo "3. Ensure you're logged in to Bing using your Microsoft account."
    echo "4. With the devtools panel open, press F5 to reload the page."
    echo "5. Locate the first listed network request (a GET request to the www.bing.com endpoint/url)."
    echo "6. Right-click on the cookie value in the request headers and select the 'Copy value' option."
    echo
    echo "Paste your long cookie string below:"
    read -r cookie
fi

#continue
echo
rm setup.bat
echo
echo "# Choose either BING_TOKEN or BING_COOKIES > .env"
echo "# If both are filled, BING_COOKIES will be preferred" >> .env
echo "# Check README.md for details on how to get these" >> .env
echo "BING_TOKEN=\"$token\"" >> .env
echo "BING_COOKIES=\"$cookie\"" >> .env
echo >> .env

if [[ "$answer2" == "1" ]]; then
    echo "ENABLE_REACTIONS=\"true\"" >> .env
elif [[ "$answer2" == "2" ]]; then
    echo "ENABLE_REACTIONS=\"dms_only\"" >> .env
elif [[ "$answer2" == "3" ]]; then
    echo "ENABLE_REACTIONS=\"groups_only\"" >> .env
elif [[ "$answer2" == "4" ]]; then
    echo "ENABLE_REACTIONS=\"false\"" >> .env
fi

echo >> .env
echo "# Change to your liking. These are the defaults" >> .env
echo "QUEUED_REACTION=\"🔁\"" >> .env
echo "WORKING_REACTION=\"⚙️\"" >> .env
echo "DONE_REACTION=\"✅\"" >> .env
echo "ERROR_REACTION=\"⚠️\"" >> .env
echo >> .env
echo "rm setup.sh" > start.sh
echo "yarn dev" >> start.sh
echo "read -p \"Press Enter to continue...\"" >> start.sh
chmod +x start.sh
yarn install
./start.sh
