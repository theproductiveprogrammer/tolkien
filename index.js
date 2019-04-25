'use strict'
const fs = require('fs')
const shajs = require('sha.js')
const moby = require('moby')

/*      outcome/
 * Monkey around with the user's hard work
 */
function main() {
    if(process.argv.length != 3) {
        console.error(`Need path to file`)
    } else {
        onchange(process.argv[2])
    }
}

function onchange(f) {
    console.log(`Monitoring: ${f}`)
    gethash(f, (err, hash) => {
        if(err) console.error(err)
        monitor_1(f, hash)
    })

    function monitor_1(f, hash) {
        setTimeout(() => {
            gethash(f, (err, hash2) => {
                if(err) {
                    if(err.code != 'ENOENT') console.error(err)
                    monitor_1(f, hash)
                } else if(hash != hash2) {
                    update(f, (err, hashnew) => {
                        if(err) console.error(err)
                        else hash = hashnew
                        monitor_1(f, hash)
                    })
                } else {
                    monitor_1(f, hash)
                }
            })
        }, 500)
    }
}

function update(f, cb) {
    fs.readFile(f, 'utf8', (err, data) => {
        if(err) cb(err)
        else {
            console.log(`Monkeying around with: ${f}`)
            let upd = monkey(data)
            fs.writeFile(f, monkey(data), (err) => {
                if(err) cb(err)
                else gethash(f, cb)
            })
        }
    })
}

function monkey(data) {
    data = play_with_paragraphs_1(data)
    data = withParas(data, [play_with_sentences_1, play_with_words_1])
    return data

    function withParas(data, transformers) {
        let paras = data.split('\n')
        let r = []
        for(let i = 0;i < paras.length;i++) {
            let o = paras[i]
            if(o.startsWith('.') || o.trim().length == 0) {
                r.push(o)
            } else {
                let u = o
                for(let j = 0;j < transformers.length;j++) {
                    u = transformers[j](u)
                }
                r.push(o)
                u = u.trim()
                if(u.length) r.push('. _' + u + '_')
            }
        }
        return r.join('\n')
    }

    function play_with_paragraphs_1(data) {
        if(Math.random() > 1/5) return data
        let paras = data.split('\n\n')
        let r = []
        let l = []
        if(paras.length < 2) return data
        r.push(paras[0])
        for(let i = 1;i < paras.length;i++) {
            if(Math.random() < 1/20) l.push(i)
            else r.push(paras[i])
        }
        for(let i = 0;i < l.length;i++) {
            r.push(paras[l[i]])
        }
        return r.join('\n\n')
    }

    function play_with_sentences_1(data) {
        if(Math.random() < 1/5) {
            let sentences = data.split('.')
            let ndx = Math.floor(sentences.length * Math.random())
            sentences.splice(ndx, 1, sentences)
            return sentences.join('.')
        } else {
            return data
        }
    }

    function play_with_words_1(data) {
        let u = remove_random_words_1(data)
        u = replace_random_words_1(u)
        return u
    }

    function remove_random_words_1(data) {
        if(Math.random() > 4/5) return data
        let words = data.split(' ')
        let num = Math.floor(Math.random()*(words.length*2/3))
        for(let i = 0;i < num;i++) {
            let ndx = Math.floor(words.length * Math.random())
            words.splice(ndx, 1)
        }
        return words.join(' ')
    }

    function replace_random_words_1(data) {
        let words = data.split(' ')
        let num = Math.floor(Math.random()*words.length)
        for(let i = 0;i < num;i++) {
            let ndx = Math.floor(words.length * Math.random())
            let syns = moby.search(words[ndx])
            if(!syns || !syns.length) continue
            let repndx = Math.floor(syns.length * Math.random())
            words.splice(ndx, 1, syns[repndx])
        }
        return words.join(' ')
    }
}

function backup(f, cb) {
    fs.copyFile(f, bakname(f), fs.constants.COPYFILE_EXCL, cb)

    function bakname(f) {
        return `${f}-${Date.now()}.draft`
    }
}

function gethash(f, cb) {
    fs.readFile(f, 'utf8', (err, data) => {
        if(err) cb(err)
        else {
            let hash = shajs('sha256').update(data)
            cb(null, hash.digest('hex'))
        }
    })
}

main()
