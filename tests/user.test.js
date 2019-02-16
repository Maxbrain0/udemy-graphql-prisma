import 'cross-fetch/polyfill'
import '@babel/polyfill'
import ApolloBoost, { gql } from 'apollo-boost'
import bcrypt from 'bcryptjs'
import prisma from '../src/prisma'

const client = new ApolloBoost({
  uri: 'http://localhost:4000'
})

beforeEach(async () => {
  await prisma.mutation.deleteManyPosts()
  await prisma.mutation.deleteManyUsers()
  const user = await prisma.mutation.createUser({
    data: {
      name: 'Bob',
      email: 'bob@bob.com',
      password: bcrypt.hashSync('blablabla1234')
    }
  })

  await prisma.mutation.createPost({
    data: {
      title: 'A published post',
      body: 'I cannot wait for my readers to read this',
      published: true,
      author: {
        connect: {
          id: user.id
        }
      }
    }
  })
  await prisma.mutation.createPost({
    data: {
      title: 'An unpublished post',
      body: 'I hope nobody reads this ever',
      published: false,
      author: {
        connect: {
          id: user.id
        }
      }
    }
  })
})

test('Should create a new user', async () => {
  const createUser = gql`
    mutation {
      createUser(
        data: {
          name: "Jacob"
          email: "jacob@example.com"
          password: "password1234"
        }
      ){
        token
        user {
          id
        }
      }
    }
  `

  const response = await client.mutate({
    mutation: createUser
  })

  const userExists = await prisma.exists.User({
    id: response.data.createUser.user.id
  })

  expect(userExists).toBe(true)
})

test('Should expose public author profiles', async () => {
  const getUsers = gql`
    query {
      users {
        id
        name
        email
      }
    }
  `

  const response = await client.query({
    query: getUsers
  })

  expect(response.data.users.length).toBe(1)
  expect(response.data.users[0].email).toBe(null)
  expect(response.data.users[0].name).toBe('Bob')
})

test('Should expose public posts', async () => {
  const getPosts = gql`
    query {
      posts {
        id
        body
        title
        published
      }
    }
  `

  const response = await client.query({
    query: getPosts
  })

  expect(response.data.posts.length).toBe(1)
  expect(response.data.posts[0].published).toBe(true)
})