import express from 'express';

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('server is ready');
});

// app.use(express.static('dist'));

//get a list of 5 jokes
app.get('/api/jokes', (req, res) => {
  const jokes = [
    {
        id:1,
        title: "Funny Joke",
        joke: "Why don't scientists trust atoms? Because they make up everything!"
    },
    {
        id:2,
        title: "Dad Joke",
        joke: "I told my wife she was drawing her eyebrows too high. She looked surprised!"
    },
    {
        id:3,
        title: "Knock Knock Joke",
        joke: "Knock, knock. Who’s there? Lettuce. Lettuce who ? Lettuce in, it’s freezing out here!"
    },
    {
        id:4,
        title: "Programming Joke",
        joke: "Why do programmers prefer dark mode? Because light attracts bugs!"
    }
  ];
  res.send(jokes);
//   res.json(jokes);
});
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});