//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const date = require(__dirname + "/date.js");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

const items = ["Buy Food", "Cook Food", "Eat Food"];

mongoose.connect("mongodb://localhost:27017/todolistDB", {useNewUrlParser: true});

const itemsSchema = mongoose.Schema({
  name: String
});

//Create model
const Item = mongoose.model('Item', itemsSchema);
//Insert document into model.
const item1 = new Item({name: 'Welcome to your todolist!'});
const item2 = new Item({name: 'Hit the + button to add a new item.'});
const item3 = new Item({name: '<-- Hit this to delete an item.'});

//Lets put all items or documents into an array
const defaultItems = [item1, item2, item3];

const listSchema = mongoose.Schema({
  name: String,
  items: [itemsSchema]
})

const List = mongoose.model('List', listSchema);
//Insert documents/items into our Item collection or item model.
// Item.insertMany(defaultItems, function(err) {
//   if(err) {
//     console.log(err)
//   } else {
//     console.log("Success")
//   }
// })

app.get("/", function(req, res) {

const day = date.getDate();

  Item.find({}, function (err, foundItems){
    if(foundItems.length === 0) {
      Item.insertMany(defaultItems, function(err) {
        if(err) {
          console.log(err)
        } else {
          console.log("Successfully saved default items to DB.")
        }
        res.redirect('/')
      })
    } else {
      res.render("list", {listTitle: day, newListItems: foundItems});
    }
  });
});

app.get("/:customListName", function(req, res){
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({name: customListName}, function(err, foundList){
    if(!err){
      if(foundList === null){
        //create new list
        const list = new List({
          name: customListName,
          items: defaultItems
        })

        list.save();
        res.redirect("/" + customListName);
      } else {
        //Show an existing list
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items})
      }
    }
  })
})

app.post("/", function(req, res){
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const newItem = new Item({name: itemName});

  if(listName === date.getDate()){
    newItem.save();
    res.redirect("/");
  } else {
    List.findOne({name: listName}, function(err, foundList){
      if(err) {
        console.log(err)
      } else {
        foundList.items.push(newItem);
        foundList.save();
        res.redirect("/"+ listName);
      }
    })
  }
});

app.post("/delete", function(req, res){
  const checkedItemId = req.body.checkbox;
  const checkedListName = req.body.listName;

  if(checkedListName === date.getDate()) {
    Item.findByIdAndRemove(checkedItemId, function(err){
      if(err){
        console.log(err)
      } else {
        console.log("Successfully deleted")
        res.redirect("/");
      }
    })
  } else {
    List.findOneAndUpdate({name: checkedListName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundList){
      if(!err){
        res.redirect("/" + checkedListName);
      }
    })
  }

});

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
