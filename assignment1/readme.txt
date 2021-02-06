
Folder structure:
data    - contains json files with data for every section of the page
images  - contains images used in the application
js      - custom js code, only a single file that holds one function for each section 
libs    - d3 js minified version, so that it can work without internet
styles  - custom css styles


Steps to run and test the program:
1. Make sure node.js is installed. If not download and installed from the following website based on the os:
https://docs.npmjs.com/downloading-and-installing-node-js-and-npm

2. Run the following command to install simple static server
$ npm install -g live-server

3. Navigate to the root of the project folder and run the following command then it will automatically open the page
$ live-server