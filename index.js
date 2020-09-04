require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose')
const fetch = require("node-fetch")
const ShortUrl = require('./models/shortUrl')
const bodyParser = require('body-parser')
const app = express()
const createAccountLimiter = require('./rateLimiter')

mongoose.connect(process.env.DB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})

app.set('view engine', 'ejs')
app.use(express.urlencoded({ extended: false}))
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({ extended: false }))

app.get('/', createAccountLimiter, (req, res) => {
    return res.render('index', {"message":""})
})

app.post('/shortUrls', createAccountLimiter, async (req, res) => {
    const secret_key = process.env.CAPTCHA_SECRET;
	const response = req.body["g-recaptcha-response"];
	const url = `https://www.google.com/recaptcha/api/siteverify?secret=${secret_key}&response=${response}`;
	const data = {
		secret_key,
		response,
	};
	try {
		const response = await fetch(url, {
			method: "post"
		});
		const responseJSON = await response.json();
		if (responseJSON.success) {
            const shortUrl = await ShortUrl.findOne({ short: req.body.shortUrl})
            console.log(shortUrl)
            if (shortUrl != null) {
                return res.render('index', {"message": "URL already exists."})
        }
		if(!req.body.shortUrl.match(/^[a-zA-Z]+?[^\\\/:*?"<>|\n\r]+$/)){
			return res.render('index', {"message": "Doesn't seem like a valid custom URL"});
		}
	    if(req.body.fullUrl == /(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g) {
		return res.render('index', {"message": "Please enter an actual URL to be shortened."});
	    } else {
            var https = require('https');
            https.get(req.body.fullUrl, async function (response) {
                await ShortUrl.create({full: req.body.fullUrl, short: req.body.shortUrl});
                console.log('SUCCESS')
                return res.render('index', {message:"URL successfully shortened: ", 'link': req.body.shortUrl})
            }).on('error', function(e) {
                return res.render('index', {'message':'The URL is not valid.', })
            });;
            }
        }
    }
    catch (error) {
        console.log(error)
    }
})

app.get('/test', async (req, res) => {
    res.sendFile(__dirname+'/public/test.js')
})

app.get('/shortUrls', async (req, res) => {
    return res.render('index', {'message': ''})
})

app.get('/:shortUrl', createAccountLimiter, async (req, res) => {
    const shortUrl = await ShortUrl.findOne({ short: req.params.shortUrl})
    if (shortUrl == null) return res.sendStatus(404)

    shortUrl.clicks++
    shortUrl.save()

    return res.status(201).redirect(shortUrl.full)
})

const port = process.env.PORT || 3000
app.listen(port, (err) => {
  console.log(`Shortener listening on ${port}!`)
  if (err) throw err
})
