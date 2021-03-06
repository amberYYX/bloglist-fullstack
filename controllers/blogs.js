const blogRouter = require('express').Router()
const Blog = require('../models/blog')
const User = require('../models/user')
const jwt = require('jsonwebtoken')

blogRouter.get('/',async(req, res) => {
  const blogs = await Blog.find({}).populate('user')
  res.json(blogs)
})
//---------------------------------------------------

blogRouter.get('/:id', async(req, res) => {
  const aimBlog = await Blog.findById(req.params.id)
  res.json(aimBlog)
})

//blog attached to user
//---------------------------------------------------
const getTokenFrom = request => {
  const authorization = request.get('authorization')

  if (authorization && authorization.toLowerCase().startsWith('bearer ')) {
    return authorization.substring(7)
  }
  return null
}
//---------------------------------------------------


blogRouter.post('/', async(req, res) => {
  const body = req.body

  const token = getTokenFrom(req)
  const decodedToken = jwt.verify(token, process.env.SECRET)
  // const decodedToken = jwt.verify(req.token, process.env.SECRET)

  if (!token || !decodedToken.id) {
    return res.status(401).json({ error: 'token missing or invalid' })
  }
  const user = await User.findById(decodedToken.id)


  const newBlog = new Blog({
    title: body.title,
    author: body.author,
    url: body.url,
    likes: 0,
    user: user._id
  })

  const savedNewBlog = await newBlog.save()

  user.blogs = user.blogs.concat(savedNewBlog._id)
  await user.save()

  const newBlogs = await Blog.find({}).populate('user')

  // res.json(savedNewBlog)
  res.json(newBlogs)
})

//---------------------------------------------------
blogRouter.delete('/:id', async(req, res) => {

  const token = getTokenFrom(req)
  const decodedToken = jwt.verify(token, process.env.SECRET)

  if (!token || !decodedToken.id) {
    return res.status(401).json({ error: 'token missing or invalid' })
  }

  const blog = await Blog.findById(req.params.id)
  const user = await User.findById(decodedToken.id)


  if ( blog.user.toString() === user._id.toString() ){

    user.blogs = user.blogs.filter(b => b.toString() !== req.params.id)
    await user.save()

    await Blog.findByIdAndRemove(req.params.id)
    res.status(204).end()
  }
})

//---------------------------------------------------
blogRouter.put('/:id', async(req, res) => {
  // const body = req.body

  // const token = getTokenFrom(req)
  // const decodedToken = jwt.verify(token, process.env.SECRET)

  // if (!token || !decodedToken.id) {
  //   return res.status(401).json({ error: 'token missing or invalid' })
  // }

  // const user = await User.findById(decodedToken.id)

  // if (user !== null) {
  //   const updatedBlog = await Blog.findByIdAndUpdate(req.params.id, body )
  //   console.log(updatedBlog)

  //   res.json(updatedBlog)
  // }else {
  //   return res.status(401).json({ error: 'user not find' })
  // }

  const body = req.body

  // mongoose.set( new: true  )

  const updatedBlog = await Blog.findByIdAndUpdate(req.params.id, body, { new: true } )

  const updatedBlogMoreInfo = await Blog.findById(req.params.id).populate('user')
  // const updatedBlogMoreInfo = updatedBlog.populate('user')
  console.log(`with info ${updatedBlogMoreInfo}`)

  res.json(updatedBlogMoreInfo)
})



module.exports = blogRouter