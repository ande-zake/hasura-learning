const fetch = require("node-fetch")
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken');

const HASURA_OPERATION = `
query($username: String!){
  users(where: {username: {_eq: $username}}, limit: 1) {
    id
    name
    password
  }
}
`;

// execute the parent operation in Hasura
const execute = async (variables, reqHeaders) => {
  const fetchResponse = await fetch(
    "http://103.82.241.60:82/v1/graphql",
    {
      method: 'POST',
      headers: reqHeaders || {},
      body: JSON.stringify({
        query: HASURA_OPERATION,
        variables
      })
    }
  );
  const data = await fetchResponse.json();
  console.log('DEBUG: ', data);
  return data;
};
  

// Request Handler
const handler = async (req, res) => {

  // get request input
  const { username, password } = req.body.input;

  // execute the Hasura operation
  const { data, errors } = await execute({ username }, req.headers);

  // if Hasura operation errors, then throw error
  if (errors) {
    return res.status(400).json(errors[0])
  }

  if(data.users.length < 1){
    return res.json({
      id:null,
      name:"",
      username:"",
      token: null
    })
  }

  bcrypt.compare(password, data.users[0].password, function(err, result){
    if(result){
      const tokenContents = {
        sub: data.users[0].id.toString(),
        name: data.users[0].name.toString(),
        iat: Date.now() / 1000,
        iss: 'https://myapp.com/',
        "https://hasura.io/jwt/claims": {
          "x-hasura-allowed-roles": ["user"],
          "x-hasura-user-id": data.users[0].id.toString(),
          "x-hasura-default-role": "user",
          "x-hasura-role": "user"
        },
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60)
      }
    
      const token = jwt.sign(tokenContents, process.env.ENCRYPTION_KEY);
    
      // success
      return res.json({
        id:data.users[0].id.toString(),
        name:data.users[0].name.toString(),
        username: username,
        token: token
      })
    }
    else{
      return res.json({
        id:null,
        name:"",
        username:"",
        token: null
      })
    }
  });
};

module.exports = handler;