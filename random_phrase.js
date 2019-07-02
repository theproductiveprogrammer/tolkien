'use strict'
const path = require('path')
const fs = require('fs')
const readline = require('readline');

module.exports = get

let LINES = []

function get() {
    let r = []
    r.push(LINES[Math.floor(Math.random()*LINES.length)])
    r.push(LINES[Math.floor(Math.random()*LINES.length)])
    r.push(LINES[Math.floor(Math.random()*LINES.length)])
    r.push(LINES[Math.floor(Math.random()*LINES.length)])
    return r.join(', ')
}

/*      outcome/
 * Load all the data text files from the 'data/' subfolder and read in
 * all the lines (ignoring TITLE LINES)
 */
function load() {
    let dataFolder = path.join(__dirname, 'data')
    fs.readdir(dataFolder, (err, files) => {
        if(err) throw err
        else {
            for(let i = 0;i < files.length;i++) {
                load_lines_1(path.join(dataFolder, files[i]))
            }
        }
    })

    function load_lines_1(f) {
        const rl = readline.createInterface({
            input: fs.createReadStream(f),
            crlfDelay: Infinity
        })
        rl.on('line', (line) => {
            line = line.trim()
            if(line && !is_title_1(line)) LINES.push(line)
        })
    }

    function is_title_1(line) {
        return line.match(/^[A-Z][A-Z][A-Z]*/)
    }
}

load()
