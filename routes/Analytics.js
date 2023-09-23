const express = require('express')
const mongoose = require('mongoose')
const Router = express.Router()
const config = require('../config.json')
const Accounts = require('../models/Accounts.js')
const Analytics = require('../models/Analytics.js')
const uri = config.MONGODB_CONNECTION + (config.SERVER_BASE_URL.includes('http://localhost') ? 'analytics-dev' : 'analytics')

const mapData = (data, activityData, type) => {
    let dataObject = {
        date: null,
        page: {
            name: null,
            views: [],
            clicks: []
        }
    }
    let activityObject = {
        hour: null,
        count: null
    }

    activityData.map((activity) => {
        dataObject = {
            date: activity.activity_date,
            page: {
                name: activity.page,
                views: [],
                clicks: []
            }
        }

        activityObject = {
            hour: activity.activity_time,
            count: activity.count
        }

        if(data.filter((d) => d.date == dataObject.date && d.page.name == dataObject.page.name).length == 0){
            data.push(dataObject)
        }

        data.map((d) => {
            if(
                d.date == dataObject.date &&
                d.page.name == dataObject.page.name &&
                d.page[type].filter((v) => v.hour == activityObject.hour).length == 0
            ){
                d.page[type].push(activityObject)
            } 
        })

        dataObject = {
            date: null,
            page: {
                name: null,
                views: [],
                clicks: []
            }
        }
        activityObject = {
            hour: null,
            count: null
        }
    })
    return data
}

Router.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", `*`); // update to match the domain you will make the request from
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, x-auth-token");
    res.header('Access-Control-Allow-Methods', `*`);
    next();
});

Router.all('/', (req, res) => {
    res.redirect('https://analytics.palmtop.co.nz');
})

Router.get('/status', (req, res) => {
    mongoose.connect(uri)
    .then(() => {
        res.status(200).json({status: 200, message: "Success"})
    })
    .catch((err) => {
        mongoose.connection.close()
        res.status(500).json({status: 500, message: "Internal server error.", error: "Could not connect to database.", details: err})
    })
    
})

Router.get('/analytics', (req, res) => {
    const account = req.body.account
    const from = req.body.from
    if(account === undefined || account === null || account === false || account == "" || !account){
        res.status(404).json({status: 404, message: 'Undefined account.'})
    } else {
        const clicks = {}
        mongoose.connect(uri)
        .then(() => {
            Analytics.find({account_id: account})
            .sort({activity_date: 1, activity_time: 1})
            .then((analytics) => {
                mongoose.connection.close()

                let data = []
                const viewsData = analytics.filter(a => a.type == "view")
                const clickData = analytics.filter(a => a.type == "click")

                data.concat(mapData(data, viewsData, "views"))
                data.concat(mapData(data, clickData, "clicks"))

                res.status(200).json({status: 200, message: "Success.", data})
            })
            .catch((err) => {
                mongoose.connection.close()
                console.log(err)
                res.status(401).json({status: 401, message: "Invalid user.", details: err})
            })
        })
        .catch((err) => {
            mongoose.connection.close()
            res.status(500).json({status: 500, message: "Internal server error.", error: "Could not connect to database.", details: err})
        })
    }
})

Router.get('/verify', (req, res) => {
    const domain = req.get('host')
    if(domain === undefined || domain === null || domain === false || domain == "" || !domain){
        res.status(404).json({status: 401, message: 'Undefined user.'})
    } else {
        mongoose.connect(uri)
        .then(() => {
            Accounts.find(domain.toLocaleLowerCase() ? {domain: domain.toLocaleLowerCase()} : null)
                .sort({date: -1})
                .then((accounts) => {
                    mongoose.connection.close()
                    res.status(200).json({status: 200, message: "User verified.", account: accounts._id})
                })
                .catch((err) => {
                    mongoose.connection.close()
                    res.status(401).json({status: 401, message: "Invalid user.", details: err})
                })
        })
        .catch((err) => {
            mongoose.connection.close()
            res.status(500).json({status: 500, message: "Internal server error.", error: "Could not connect to database.", details: err})
        })
    }    
})

Router.post('/register', (req, res) => {
    const domain = req.body.domain
    const newAccount = new Accounts({
        first_name: req.body.first_name,
        last_name: req.body.last_name,
        email: req.body.email,
        password: req.body.password,
        domain: domain
    })
    if(domain === undefined || domain === null || domain === false || domain == "" || !domain){
        res.status(404).json({status: 401, message: 'Undefined.'})
    } else {
        mongoose.connect(uri)
        .then(() => {
            newAccount.save()
                .then((account) => {
                    mongoose.connection.close()
                    res.status(200).json({status: 200, message: "Account created.", account: {name: account.first_name + " " + account.last_name, emai: account.email, domain: account.domain, account_id: account._id}})
                })
                .catch((err) => {
                    mongoose.connection.close()
                    res.status(401).json({status: 401, message: "Account already exists.", details: err})
                })
        })
        .catch((err) => {
            mongoose.connection.close()
            console.log(err)
            res.status(500).json({status: 500, message: "Internal server error.", error: "Could not connect to database.", details: err})
        })
    }    
})

Router.post('/verify', (req, res) => {
    const domain = req.body.domain
    if(domain === undefined || domain === null || domain === false || domain == "" || !domain){
        res.status(404).json({status: 401, message: 'Undefined user.'})
    } else {
        mongoose.connect(uri)
        .then(() => {
            Accounts.findOne(domain.toLocaleLowerCase() ? {domain: domain.toLocaleLowerCase()} : null)
                .sort({date: -1})
                .then((accounts) => {
                    mongoose.connection.close()
                    res.status(200).json({status: 200, message: "User verified.", account: accounts._id})
                })
                .catch((err) => {
                    mongoose.connection.close()
                    res.status(401).json({status: 401, message: "Invalid user."})
                })
        })
        .catch((err) => {
            mongoose.connection.close()
            res.status(500).json({status: 500, message: "Internal server error.", error: "Could not connect to database.", details: err})
        })
    }  
})

Router.post('/view', (req, res) => {
    const account = req.body.account
    const page = req.body.page
    const date = req.body.date
    const time = req.body.time
    if(account === undefined || account === null || account === false || account == "" || !account){
        res.status(404).json({status: 404, message: 'Undefined account.'})
    } else {
        mongoose.connect(uri)
        .then(() => {
            Analytics.updateOne(
                {
                    account_id: account,
                    page: page,
                    type: "view",
                    activity_date: date,
                    activity_time: time
                }, 
                {$inc: 
                    {
                        count: 1
                    }
                }, 
                {
                    new: true, 
                    upsert: true
                }
            )
            .sort({date: -1})
            .then((analytic) => {
                res.status(200).json({status: 200, message: "Success."})
            })
            .catch((err) => {
                console.log(err)
                res.status(500).json({status: 500, message: "Internal server error.", error: "Could not update analytics"})
            })
        })
        .catch((err) => {
            mongoose.connection.close()
            res.status(500).json({status: 500, message: "Internal server error.", error: "Could not connect to database.", details: err})
        })
    }
})

Router.post('/click', (req, res) => {
    const account = req.body.account
    const page = req.body.page
    const date = req.body.date
    const time = req.body.time
    if(account === undefined || account === null || account === false || account == "" || !account){
        res.status(404).json({status: 404, message: 'Undefined account.'})
    } else {
        mongoose.connect(uri)
        .then(() => {
            Analytics.updateOne(
                {
                    account_id: account,
                    page: page,
                    type: "click",
                    activity_date: date,
                    activity_time: time
                }, 
                {$inc: 
                    {
                        count: 1
                    }
                }, 
                {
                    new: true, 
                    upsert: true
                }
            )
            .sort({date: -1})
            .then((analytic) => {
                res.status(200).json({status: 200, message: "Success."})
            })
            .catch((err) => {
                console.log(err)
                res.status(500).json({status: 500, message: "Internal server error.", error: "Could not update analytics"})
            })
        })
        .catch((err) => {
            mongoose.connection.close()
            res.status(500).json({status: 500, message: "Internal server error.", error: "Could not connect to database.", details: err})
        })
    }
})

module.exports = Router