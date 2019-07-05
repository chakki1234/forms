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
        //    connection.query(`CREATE TABLE demo4(id INT, email VARCHAR(255), password VARCHAR(255), forms INT, formtxt TEXT,  UNIQUE(ID), UNIQUE(email))`, (err)=>{
        //    console.log(err);
        //    });
        // connection.query(`CREATE TABLE demo5( userid INT, email VARCHAR(255), fno INT, fcontent TEXT , qno INT, databasenm VARCHAR(255), title VARCHAR(255), description VARCHAR(255))`);
        // connection.query(`CREATE TABLE demo6()`)
        // connection.query(`DELETE FROM demo5`);
        let title = `Signup`;
        res.render(`Signuppg.ejs`, { title: title });
       
    });

app.post(`/signup`, (req, res)=>{
let hash = bcrypt.hashSync(req.body.password, 14);
req.body.password =  hash;
let entity = {
    email : req.body.email,
    password : req.body.password,
    forms : 0,
    id : Math.random()*1000,
    formtxt : 'refer other table'
};
connection.query(`INSERT INTO demo4 SET ?`, entity, (err)=>{
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
connection.query(`SELECT * FROM demo4 WHERE email = "${req.body.email}" `, (err,result)=>{
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

app.get(`/form`, loggedin, (req, res)=>{
let title = `form`;
connection.query(`SELECT * FROM demo4 WHERE email = '${req.session.email}'`, (err, result)=>{
res.render(`form.ejs`, { title: title , user: result });
    });
});

app.post(`/postfmcont`, (req, res)=>{
connection.query(`UPDATE demo4 SET forms = forms + 1 WHERE email = '${req.session.email}'`);
connection.query(`SELECT * FROM demo4 WHERE email = '${req.session.email}'`, (err, result)=>{
let demo5obj = {
    userid : result[0].id,
    email: result[0].email,
    fcontent: req.body.data,
    fno : result[0].forms-1,
    qno : req.body.questionno,
    databasenm : req.body.databasename,
    title: req.body.title,
    description: req.body.description
};
connection.query(`INSERT INTO demo5 SET ?`, demo5obj, (err)=>{
let qury = `CREATE TABLE ${req.body.databasename}(`;
    for(let i=1;i<=req.body.questionno;++i){
         qury += `q${i} VARCHAR(255)`; 
         if(!(i==req.body.questionno))
         qury+=`,`
         else
         qury+=`)`;
        }
// console.log(qury);
connection.query(qury, (err)=>{
    if(err)
    console.log(err);
});
});
});
});

// view form
app.get(`/:id/:forms/form`, (req, res)=>{
let title = `formpg`;
connection.query(`SELECT * FROM demo5 WHERE userid = ${req.params.id} and fno = ${req.params.forms}`,(err, result)=>{
res.render(`mntemp.ejs`, { title: title, result: result });
    });
});

app.post(`/postformres/:dbnm`, (req, res)=>{
    connection.query(`INSERT INTO ${req.params.dbnm} SET ?`, req.body);
    res.send('got it');
});

app.get(`/view`, loggedin, (req, res)=>{
connection.query(`SELECT * FROM demo5 WHERE email = '${req.session.email}'`, (err, result)=>{
let title = 'view';
res.render(`viewres.ejs`, { title: title, result: result });
});
});

app.get(`/finalres/:dbnm/:qno/:fno`, (req, res)=>{
connection.query(`SELECT * FROM ${req.params.dbnm}`, (err, result)=>{
connection.query(`SELECT fcontent FROM demo5 WHERE email = '${req.session.email}' and fno = ${req.params.fno}`,(err, content)=>{
let title = `response`;
res.render(`response.ejs`, { title: title, result: result, qNo: req.params.qno, fNo : req.params.fno, content: content });
});
});
});

app.listen(3000, (err)=>{
console.log(`sever started`);
});
