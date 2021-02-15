
Extract the zip file and it should have the following structure in code folder:
data    - contains json files with data for every section/block of the background image
images  - contains images used in the application
js      - custom js code, only a single file that holds one function for each section 
libs    - d3 js minified version, so that it can work without internet
styles  - custom css styles


Steps to run and test the application:
1. Make sure node.js is installed. If not download and install from the following website based on the os:
https://docs.npmjs.com/downloading-and-installing-node-js-and-npm

2. Run the following command in terminal to install simple static server
$ npm install -g live-server

3. Navigate to the root folder(code) and run the following command in terminal
$ live-server

It will automatically open the page in default browser.


Notes:
1. On load it shows a bit of animation.
2. Color change effect is added on hover pie/bar charts.
*3. I do not have windows machine, so could not test in windows but hope it will work there as well.