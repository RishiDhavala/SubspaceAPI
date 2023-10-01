const express = require("express");
const body_parser = require("body-parser");
const lodash = require("lodash");
const axios = require("axios");
require("dotenv").config();


const app = express();
app.use(express.json());

const PORT=process.env.PORT;
const API_URL = process.env.API_URL;
const SECRET_KEY = process.env.SECRET_KEY;

//fetching and memoizing the values
var fetchBlog = lodash.memoize(async function (API_URL, SECRET_KEY) {
  const response = await axios.get(API_URL, {
    headers: {
      "x-hasura-admin-secret": SECRET_KEY,
    },
  });

  const blogs = response.data.blogs;

  return blogs;
});

//Data Analysis of the fetched data and memoizing the values
var blogStatistics = lodash.memoize(function (blogs) {
  const totalBlogsFetched = lodash.size(blogs);
  const longestTitle = lodash.maxBy(blogs, (obj) => obj.title.length);
  const blogsWithPrivacy = lodash.size(blogs.filter((blog) => blog.title.toLowerCase().includes("privacy")));
  const blogArray = lodash.uniqBy(blogs, "title");

  const stats = {
    total_blogs_fetched: totalBlogsFetched,
    blog_with_longest_title: longestTitle,
    total_blogs_with_privacy: blogsWithPrivacy,
    blogs_with_unique_titles: blogArray.map((blog) => blog.title),
  };

  return stats;
});


//Search blogs and memoize values for the same query
var searchBlogs = lodash.memoize(function (blogs, query) {
  const searchResults = blogs.filter((blog) =>
    blog.title.toLowerCase().includes(query.toLowerCase())
  );

  return searchResults;
});

//GET request to fetch the blogs and analyse the data and return the requires statistics
app.get("/api/blog-stats", async (req, res) => {
  try {
    const blogs = await fetchBlog(API_URL, SECRET_KEY);
    const stats = blogStatistics(blogs);

    res.status(200).json(stats);
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
});


//GET request to fetch the searched blogs through the given query
app.get("/api/blog-search", async (req, res) => {
  try {
    const query = req.query.query;
    const blogs = await fetchBlog(API_URL, SECRET_KEY);
    const searchResults = searchBlogs(blogs, query);

    res.status(200).json(searchResults);
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
});


app.listen(PORT, () => {
  console.log("Listening on port " + PORT);
});
