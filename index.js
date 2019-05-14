'use strict'
const express = require('express')
const serveStatic = require('serve-static')

const app = express()
const bodyParser = require('body-parser')

const moby = require('moby')
const pluralize = require('pluralize')

app.use(bodyParser.urlencoded({extended:true}))
app.use(bodyParser.json())

app.use('/monkey', (req, res) => {
    let data = req.body
    if(!data) return res.status(400).end()
    res.end(JSON.stringify(preservePosition(monkey, data)))
})

app.use('/clean', (req, res) => {
    let data = req.body
    if(!data) return res.status(400).end()
    res.end(JSON.stringify(preservePosition(cleanMonkey, data)))
})

app.use('/', serveStatic('public'))

let PORT=8080
app.listen(PORT, (err) => {
    if(err) console.error(err)
    else console.log(`Listening on port ${PORT}`)
})

/*      problem/
 * Given:
 *  { txt: "...", cursor: pos }
 * We want to change the txt and while still preserving the cursor
 * position to the user.
 *
 *      way/
 * We add a dummy marker that is very unlikely to be in actual text:
 *      T0lK!ENZkYfpA0hVmOnK3Y
 * then use it to find the cursor position once the text has changed and
 * then remove it.
 */
function preservePosition(transformer, data) {
    let txt = data.txt
    if(!txt) return { txt: '', cursor: 0 }
    let pos = data.cursor
    if(!pos) pos = 0

    let DUMMY_MARKER = 'T0lK!ENZkYfpA0hVmOnK3Y'
    txt = txt.substring(0, pos) + DUMMY_MARKER + txt.substring(pos)

    txt = transformer(DUMMY_MARKER, txt)

    pos = txt.indexOf(DUMMY_MARKER)
    txt = remove_dummy_marker(txt)

    return {
        txt: txt,
        cursor: pos,
    }

    function remove_dummy_marker(txt) {
        return txt.replace(DUMMY_MARKER, '')
    }

}



/*      problem/
 * We need to transform each paragraph with monkey changes and
 * return them. But these tranformed paragraphs then get mixed up
 * with the original and get re-transformed. We also do not want to
 * include the dummy marker as a word during transformation.
 *
 *      way/
 * We add a marker (MONKEY_MARKER) to the start of every transformed
 * paragraph and make sure the dummy marker word is removed before
 * we pass it on to the actual transformers.
 */
const MONKEY_MARKER = '>>      '

function isMonkeyChanges(txt) {
    return txt.startsWith(MONKEY_MARKER)
}

function markMonkeyChanged(txt) {
    return MONKEY_MARKER + txt
}

/*      outcome/
 * Walk through the lines, removing any that are monkey changes. If the
 * cursor marker is in any line we are removing, simply put it on the
 * previous line
 */
function cleanMonkey(marker, data) {
    let r = []
    let paras = data.split('\n')
    for(let i = 0;i < paras.length;i++) {
        let l = paras[i]
        if(isMonkeyChanges(l)) {
            if(l.indexOf(marker) >= 0) {
                let p = r.pop()
                if(p) {
                    p += marker
                    r.push(p)
                }
            }
        } else {
            r.push(l)
        }
    }
    return r.join('\n')
}

/*      outcome/
 * Play with paragraphs, and within each paragraph play with
 */
function monkey(marker, data) {
    data = play_with_paragraphs_1(data)
    data = withParas(data, [play_with_sentences_1, play_with_words_1])
    return data

    function remove_dummy_marker(txt) {
        return txt.replace(marker, '')
    }

    /*      outcome/
     * Move paragraphs around occasionally
     */
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

    function withParas(data, transformers) {
        let paras = data.split('\n')
        let r = []
        for(let i = 0;i < paras.length;i++) {
            let o = paras[i]
            if(isMonkeyChanges(o) || o.trim().length == 0) {
                r.push(o)
            } else {
                let u = remove_dummy_marker(o)
                for(let j = 0;j < transformers.length;j++) {
                    u = transformers[j](u)
                }
                r.push(o)
                u = u.trim()
                if(u.length && u != o) r.push(markMonkeyChanged(u))
            }
        }
        return r.join('\n')
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
        if(words.length < 3) {
            return thesaurus_me_1(words, 1)
        }
        let num = Math.floor(Math.random()*words.length)
        if(num < 5 && num > 1 && Math.random() < 1/2) return thesaurus_me_1(words, num)
        else return alternate_me_1(words, num)

        function thesaurus_me_1(words, num) {
            let r = []
            for(let i = 0;i < num;i++) {
                let ndx = Math.floor(words.length * Math.random())
                let w = pluralize.singular(words[ndx])
                let syns = moby.search(w)
                if(!syns || !syns.length) continue
                let n = Math.floor(syns.length * Math.random())
                if(n > 5) n = 7
                if(n < 1) n = 1
                for(let j = 0;j < n;j++) {
                    let sndx = Math.floor(syns.length * Math.random())
                    r.push(syns[sndx])
                }
            }
            return r.join(', ')
        }

        function alternate_me_1(words, num) {
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
}

