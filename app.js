var express = require("express");
var app = express();
var bodyparser = require("body-parser");
var mysql = require("mysql");
var sessions = require("client-sessions");
var bcrypt = require("bcryptjs");
var connection = mysql.createConnection({
    host: `localhost`,
    user: `root`,
    password: ``,
    database: `form`
});

app.use(bodyparser.urlencoded({ extended: true }));
app.use(express.static(`public`));
connection.connect((err)=>{
if(err)
    console.log(err);
else
    console.log(`connected to the database`)
});
app.use(sessions({
    cookieName: `session`,
    secret: `i will do it`,
    duration: 1000*60*60
}));

function loggedin(req, res, next){
    if(req.session.email)
       next();
    else
       res.redirect(`/login`);
}

app.get("/", (req, res)=>{ 
           let title = `Signup`;
           res.render(`Signuppg.ejs`, { title: title });
    });

app.post(`/signup`, (req, res)=>{
let hash = bcrypt.hashSync(req.body.password, 14);
req.body.password =  hash;
connection.query(`INSERT INTO demo2 SET ?`, req.body, (err)=>{
if(err){
 if(err.errno==1062)
     res.send("user already exsist");
} else
    {   
         req.session.email = req.body.email; 
         res.redirect(`/dashboard`); 
    }
    });
});

app.get(`/login`, (req, res)=>{
let title = `Login`;
res.render(`loginpg.ejs`, { title: title });
});

app.post(`/login`, (req, res)=>{
connection.query(`SELECT * FROM demo2 WHERE email = "${req.body.email}" `, (err,result)=>{
if(result.length==0)
res.send(`Are u  sure that you are a member`);
else{
if(bcrypt.compareSync(req.body.password, result[0].password))
{
    req.session.email = req.body.email;
    res.redirect('/dashboard');
}
else{
    res.redirect(`/login`);
    }
}
});
});

app.get(`/logout`, (req, res)=>{
res.clearCookie(`session`);
res.redirect(`/`);
});

app.get(`/dashboard`, loggedin, (req, res)=>{
let title = `dashboard`;
res.render(`dashboard.ejs`, { title: title });
});

app.get(`/form`, (req, res)=>{
let title = `form`;
res.render(`form.ejs`, { title: title });
});

app.listen(3000, (err)=>{
console.log(`sever started`);
});
