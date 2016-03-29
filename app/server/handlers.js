var fs = require("fs");
var https = require("https");
var dbCo = require("./db/dbConnection.js");
var dbLaCo = require("./db/dbLargeObjectConnection.js");
var formidable = require("formidable");
var sendToUser = require("./utils/sendToUser.js");
var util = require('util');
var handlers = {
    user:{
        connect :function(req,res){
            // open bdd user.
            console.log("connect user "+req.isAuthenticated());
            res.status(200).send(sendToUser('succes','redirection',{path:'/admin'}));
        },
        create  :function(req,res){
            console.log("on create un user");
            res.status(200);

            // get user name , password, email
            // create user and set it inactive
            // register it in bdd
            // send validation email to active account with custom url (http://monsite.fr/accountActivation?param1,2,3 etc)
            // return validation that account was created and need to be active
        },
        get :function(req,res){
            // get user by name or id
            // return model from bdd
            var currentUser = req.session.passport.user;

            delete currentUser.password;
            delete currentUser.validated_by_admin;
            delete currentUser.email_valid;

            res.send({users:[currentUser]});
        },
        update :function(req,res){
            // get current user id
            // test if exist in bdd
            // update it inside bdd
            // return ok update
        },
        del :function(req,res){
            //get user id by function getUser.
            //delete user by id from bdd if user password ok twice
        }
    },
    blog:{
        editPost:function(req,res){
              var data=req.body;
            if(data.title===undefined && data.title.length <=0){
                res.status(422).send(sendToUser("error","title is missing"));
            }
            if(data.summary===undefined && data.summary.length <=0){
                res.status(422).send(sendToUser("error","summary is missing"));
            }
            if(data.content==undefined && data.content.length <=0){
                res.status(422).send(sendToUser("error","content is missing"));
            }

            var query = 'UPDATE site."blogPosts" SET (title, content, author_email,creation_date, summary, status, category_id) = (\''+
                data.title+'\',\''+
                data.content+'\',\''+
                req.user.email+'\',\''+
                data.timeStamp+'\',\''+
                data.summary+'\',\''+
                data.postStatusId+'\',\''+
                data.categoryId
                +'\') WHERE site."blogPosts"."id"='+req.params.blogPostId+' RETURNING *;';

            dbCo(query,function(poolRealese,err,queryResp){
                poolRealese(err);
                if(err)
                {
                    console.log(err);
                    res.status(400).send(sendToUser("error","error update new post."));
                }else{
                    if(queryResp.rowCount<=0)
                        res.status(400).send(sendToUser("error"," impossible to update new post."));
                    else
                        res.status(200).send(sendToUser('success',"blog post successfully updated.",queryResp.rows[0]));
                }
            });
        },
        createPost:function(req,res){
            var data=req.body;
            if(data.title===undefined && data.title.length <=0){
                res.status(422).send(sendToUser("error","title is missing"));
            }
            if(data.summary===undefined && data.summary.length <=0){
                res.status(422).send(sendToUser("error","summary is missing"));
            }
            if(data.content==undefined && data.content.length <=0){
                res.status(422).send(sendToUser("error","content is missing"));
            }

            var query = 'INSERT INTO site."blogPosts" (title, content, author_email,creation_date, summary, status, category_id) VALUES (\''+
                data.title+'\',\''+
                data.content+'\',\''+
                req.user.email+'\',\''+
                data.timeStamp+'\',\''+
                data.summary+'\',\''+
                data.postStatusId+'\',\''+
                data.categoryId
                +'\') RETURNING *;';

            dbCo(query,function(poolRealese,err,queryResp){
                poolRealese(err);
                if(err)
                {
                    console.log(err);
                    res.status(400).send(sendToUser("error","error create new post."));
                }else{
                    if(queryResp.rowCount<=0)
                        res.status(400).send(sendToUser("error"," impossible to create new post."));
                    else
                        res.status(200).send(sendToUser('success',"blog post successfully created.",queryResp.rows[0]));
                }
            });
        },
        getPosts:function(req,res){

            var query = 'SELECT '+
                          'A.title, '+
                          'A.id, '+
                          'A.content, '+
                          'A.creation_date, '+
                          'A.author_email, '+
                          'B.name as status, '+
                          'A.summary, '+
                          'A.category_id, '+
                          'A.content_html '+
                        'FROM '+
                         ' site."blogPosts" as A ,site."blogPostStatus" as B '+
                           'WHERE A.status = B.id ',
            filter;
            if(req.query.filter && req.query.filter !== '*'){
                query += 'AND status='+req.query.filter+' ';
            }
            if(req.query.orderBy){
                query += 'ORDER BY '+req.query.orderBy+' DESC ';
            }
            dbCo(query,function(poolRealese,err,queryResp){
                poolRealese(err);
                if(err)
                {
                    console.log(err);
                    res.status(400).send(sendToUser("error","error get posts."));
                }
                 else{
                    if(queryResp.rowCount<=0)
                        res.status(400).send(sendToUser("error"," impossible to get posts."));
                    else
                        res.status(200).send(sendToUser('success',"blog posts successfully getted.",queryResp.rows));
                }
            });
        },
        createBlogCategory:function(req,res){
            res.send("create category");
        },
        getCategories:function(req,res){
            var query = 'SELECT id, name FROM site."blogPostCategories"  ORDER BY id ASC;';
            dbCo(query,function(poolRealese,err,queryResp){
                poolRealese(err);
                if(err)
                    res.status(400).send(sendToUser("error","error get categories"));
                else{
                    console.log(queryResp.rows)
                    if(queryResp.rowCount<=0)
                        res.status(400).send(sendToUser("error"," no categories found."));
                    else
                        res.status(200).send(sendToUser('success',"categories found",{categories:queryResp.rows}));
                }
            });
        },
        getPostStatus:function(req,res){
            var query = 'SELECT id, name FROM site."blogPostStatus" ORDER BY id ASC;';
            dbCo(query,function(poolRealese,err,queryResp){
                poolRealese(err);
                if(err)
                    res.status(400).send(sendToUser("error","error get blogPostStatus"));
                else{
                    console.log(queryResp.rows)
                    if(queryResp.rowCount<=0)
                        res.status(400).send(sendToUser("error"," no categories found."));
                    else
                        res.status(200).send(sendToUser('success',"categories found",{postStatus:queryResp.rows}));
                }
            });
        },
        uploadImages:function(req,res){
            var form = new formidable.IncomingForm();
            form.encoding = 'utf-8';
            form.keepExtensions = true;
            form.type="multipart";
            form.multiples = true;
            form.parse(req, function(err,fields, files) {
                var arrFiles = Object.keys(files).map(function (key) {return files[key]});
                dbLaCo.save(arrFiles[0],function(oid){
                    var query = 'INSERT INTO site."images" (img_name,data_type,description,creation_date,oid) VALUES (\''+
                        arrFiles[0].name+'\',\''+
                        arrFiles[0].type+'\',\''+
                        fields.description+'\',DEFAULT,\''+
                        oid+'\')';

                    dbCo(query,function(poolRealese,err,queryResp){
                        poolRealese(err);
                        if(err)
                            res.status(400).send(sendToUser("error","error upload image"));
                        else{
                            if(queryResp.rowCount<=0)
                                res.status(400).send(sendToUser("error"," error upload image."));
                            else{
                                res.status(200).send(sendToUser('success',"File successfully uploaded",{postStatus:queryResp.rows}));
                            }
                        }
                    })
                });

            });
        },
        getAllImages:function(req,res){
            var data = req.params,
                query = 'SELECT img_name, data_type, description, oid FROM site."images" ;';

            dbCo(query,function(poolRealese,err,queryResp){
                poolRealese(err);
                if(err||queryResp.rowCount<=0)
                    res.status(400).send(sendToUser("error"," Image not found."));
                else{
                    res.status(200).send(sendToUser('success',"all images data send ",queryResp.rows));
                }
            });
        },
        getImageByUid:function(req,res){
            var data = req.params,
                obj = {},
                query = 'SELECT img_name, data_type, description, oid FROM site."images" WHERE oid='+data.oid+';';

            dbCo(query,function(poolRealese,err,queryResp){
                poolRealese(err);
                if(err||queryResp.rowCount<=0)
                    res.status(400).send(sendToUser("error"," Image not found."));
                else{
                       obj.name = queryResp.rows[0].img_name;
                       obj.description = queryResp.rows[0].description;
                       obj.data_type = queryResp.rows[0].data_type;
                       obj.oid = queryResp.rows[0].oid;
                       dbLaCo.load(obj,res);
                    }
            });

        }
    }
};

module.exports = handlers;