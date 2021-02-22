//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

// Hosting a mongoDB database
mongoose.connect("mongodb+srv://admin-harshit:Test123@cluster0.0ursx.mongodb.net/todoListDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const itemsSchema = new mongoose.Schema({
  name: String
});

const Items = mongoose.model("List", itemsSchema);

// Diff lists for different directories like work etc
const listSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema]
});

const DirectoryList = mongoose.model("DirectoryList", listSchema);

// Creating some items
const item1 = new Items({
  name: "Welcome to your To-Do List"
})

const item2 = new Items({
  name: "Hit + to add items"
})

const item3 = new Items({
  name: "<-- Hit this to delete an item"
})

const defaultItems = [item1, item2, item3];


app.get("/", function(req, res) {
  // Getting date
  const day = date.getDate();
  // Reading the List items from database
  Items.find(function(err, items) {
    if (err) {
      console.log(err);
    } else {
      // If database is empty then insert default items in the database
      if (items.length == 0) {
        Items.insertMany(defaultItems, function(err) {
          if (err)
            console.log(err);
          else
            console.log("Successfully inserted initial items");
        });
      }
      res.render("list", {
        listTitle: day,
        newListItems: items
      });
    }
  });
});



app.post("/", function(req, res) {
  // Adding the new item to our database
  const itemName = req.body.newItem;
  const listName = req.body.list;
  const newItem = new Items({
    name: itemName
  });

// For home route add items to home list (items) and redirect to home route
  if(listName === date.getDate()){
  newItem.save();
  // Redirecting to home route to add the new items from database
  res.redirect("/");
}

// For other routes search for list in DB and add new entry to that list
else{
DirectoryList.findOne({name: listName},function(err,result){
  if(!err){
    // Updating the other route list items array
  const updatedList = result;
  updatedList.items.push(newItem);
  updatedList.save(function(err){
      res.redirect("/"+listName);
  });
  }
});
}
});

// Now deleting a item from database after checkbox is checked
app.post("/delete", function(req, res) {
  const checkedItem = req.body.checkbox;
  const listName = req.body.listName;

  if(listName === date.getDate()){
  Items.deleteOne({_id: checkedItem}, function(err, deleteResult) {
    if (err) {
      console.log(err);
    }
  });
  res.redirect("/");
}
else{
  DirectoryList.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItem}}},function(err){
    if(!err){
      res.redirect("/"+listName);
    }
    });
  }
  });



app.get("/:customListName", function(req, res) {
  const customListName = _.capitalize(req.params.customListName);

  // If list already exists display that else create a new list
  DirectoryList.findOne({name: customListName}, function(err, result) {
    if (err) {
    }
    else
     {
      if (!result) {
        const newlist = new DirectoryList({
          name: customListName,
          items: defaultItems
        });
        newlist.save(function(err,result){
          if(!err){
            // again redirecting to same page so list is shown
            res.redirect("/"+customListName);
          }
        });
      } else {
        res.render("list", {listTitle: result.name,newListItems: result.items});
      }
    }
  });

});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
