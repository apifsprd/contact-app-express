const express = require('express')
const expressLayouts = require('express-ejs-layouts')

const {body, validationResult, check} = require('express-validator')

const session = require('express-session')
const cookieParser = require('cookie-parser')
const flash = require('connect-flash')

require('./utils/db')
const Contact = require('./model/contact')

const app = express()
const port = 3000

// setup method override
const methodOverride = require('method-override')
app.use(methodOverride('_method'))

// Setup EJS
app.set('view engine', 'ejs') // EJS View Engine
app.use(expressLayouts) // thirdparty middleware
app.use(express.static('public')) // builtin Middleware
app.use(express.urlencoded({extended: true}))// builtin Middleware

// konfigurasi flash
app.use(cookieParser('secret'))
app.use(session({
    Cookie: {maxAge:6000},
    resave: true,
    saveUninitialized: true
}))
app.use(flash())

// Halaman Beranda
app.get('/', (req, res) => {
    const mahasiswa = [{
        nama: 'Apif Supriadi',
        email: 'afs.supriadi@gmail.com'
    },
    {
        nama: 'Fauzin',
        email: 'Fauzin@gmail.com'
    },
    {
        nama: 'Adam Jihad',
        email: 'adamjihad@gmail.com'
    }]

    res.render('index', {
        layout: 'layouts/main',
        nama: 'Apif Supriadi',
        title: 'Beranda | App',
        mahasiswa
    })
})

// Halaman Tentang
app.get('/about', (req, res) => {
    res.render('about', {
    layout: 'layouts/main',
    title: 'About | App'})
})

// Halaman kontak
app.get('/contact', async (req, res) => {
    const contacts = await Contact.find()
    res.render('contact', {
        layout: 'layouts/main',
        title: 'Contact | App',
        contacts,
        msg: req.flash('msg')
    })
})

// halaman form tambah data kontak
app.get('/contact/add', (req, res) => {
    res.render('add-contact', {
        title: 'Tambah data kontak | App',
        layout: 'layouts/main'
    })
})

// proses tambah data kontak
app.post('/contact', 
    [
        body('nama').custom(async(value) => {
            const duplikat = await Contact.findOne({nama: value})
            if(duplikat){
                throw new Error('Nama kontak sudah terdaftar!')
            }
            return true
        }),
        check('email', 'Email tidak benar').isEmail(),
        check('nohp', 'Nomor telephone tidak benar').isMobilePhone('id-ID')
    ], 
    (req, res) => {
    const errors = validationResult(req)
    if(!errors.isEmpty()) {
        res.render('add-contact', {
            title: 'Tambah data kontak | App',
            layout: 'layouts/main',
            errors: errors.array()
        })
    }else{
        Contact.insertMany(req.body, (error, result) => {
            req.flash('msg', 'Data kontak berhasil ditambahkan!')
            res.redirect('/contact')
        })
    }
    })

app.delete('/contact', (req, res) => {
    // res.send(req.body) DD
    Contact.deleteOne({nama: req.body.nama}).then((result) => {
        req.flash('msg', 'Data kontak berhasil dihapus!')
        res.redirect('/contact')
    })
})

// form ubah data kontak
app.get('/contact/edit/:nama', async(req, res) => {
    const contact = await Contact.findOne({nama: req.params.nama})
    res.render('edit-contact', {
        title: 'Ubah data kontak | App',
        layout: 'layouts/main',
        contact
    })
})

//update data kontak
app.put('/contact', 
    [
        body('nama').custom(async(value, { req }) => {
            const duplikat = await Contact.findOne({nama: value})
            if(value !== req.body.oldNama && duplikat){
                throw new Error('Nama kontak sudah terdaftar!')
            }
            return true
        }),
        check('email', 'Email tidak benar').isEmail(),
        check('nohp', 'Nomor telephone tidak benar').isMobilePhone('id-ID')
    ], 
    (req, res) => {
    const errors = validationResult(req)
    if(!errors.isEmpty()) {
        res.render('edit-contact', {
            title: 'Form ubah kontak | App',
            layout: 'layouts/main',
            errors: errors.array(),
            contact: req.body
        })
    }else{
        Contact.updateOne(
            {_id: req.body._id}, 
            {
                $set: {
                nama: req.body.nama,
                email: req.body.email,
                nohp: req.body.nohp
                }
            }
        ).then((result) => {
            req.flash('msg', 'Data kontak berhasil diubah!')
            res.redirect('/contact')
        })
    }
    })

// Halaman detail kontak
app.get('/contact/:nama', async(req, res) => {
    const contact = await Contact.findOne({nama: req.params.nama})
    res.render('detail', {
        layout: 'layouts/main',
        title: 'Detail Contact | App',
        contact
    })
})

app.listen(port, () => {
    console.log(`Mongo Contact App | Listening at http://localhost:${port}`)
})