const express = require("express");
const crypto = require("node:crypto");
const cors = require("cors");
const movies = require("./movies.json");
const { validateMovie, validatePartialMovie } = require("./schemas/movies");

const app = express();
app.use(
  cors({
    origin: (origin, callback) => {
      const ACCEPTED_ORIGINS = [
        "http://localhost:8080",
        "http://pagina-inventada.com",
      ];

      if (ACCEPTED_ORIGINS.includes(origin) || !origin) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // Métodos permitidos
  })
); //Middleware para evitar el error de CORS y el PRE-Flight
app.use(express.json()); //Ejecutar la funcion middleware express.json()
app.disable("x-powered-by"); //Deshabilitar el header spam de express

// const ACCEPTED_ORIGINS = [
//   "http://localhost:8080",
//   "http://pagina-inventada.com",
// ];
//* Middleware manual para manejar peticiones CORS PRE-Flight manualmente
// app.options("/movies/:id", (req, res) => {
//   const origin = req.header("origin");
//   if (ACCEPTED_ORIGINS.includes(origin) || !origin) {
//     res.header("Access-Control-Allow-Origin", origin);
//     res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
//   }
//   res.sendStatus(200)
// });

//* -----Todos los recursos que sean MOVIES se identifican con /movies-----
app.get("/movies", (req, res) => {
  //* Solucion a Cors manualmente
  // const origin = req.header("origin");
  // if (ACCEPTED_ORIGINS.includes(origin) || !origin) {
  //   res.header("Access-Control-Allow-Origin", origin);
  //   res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  // }

  const { genre } = req.query;
  if (genre) {
    const filteredMovies = movies.filter((movie) =>
      movie.genre.some((g) => g.toLowerCase() === genre.toLowerCase())
    );
    return res.json(filteredMovies);
  }
  res.json(movies);
});

//* ----Guardar una movie-----
app.post("/movies", (req, res) => {
  const result = validateMovie(req.body);
  if (result.error) {
    return res.status(422).json({ error: JSON.parse(result.error.message) });
  }
  const newMovie = {
    id: crypto.randomUUID(),
    ...result.data,
  };
  movies.push(newMovie);
  res.status(201).json(newMovie); //Actualizar la cache del cliente
});

//* -----Obtener una pelicula por su ID-----
app.get("/movies/:id", (req, res) => {
  const { id } = req.params;
  const movie = movies.find((movie) => movie.id === id);
  movie
    ? res.json(movie)
    : res.status(404).json({ message: "Movie not found" });
});

//* -----Eliminar una movie-----
app.delete("/movies/:id", (req, res) => {
  //* Solucion a PRE-Flight manualmente
  // const origin = req.header("origin");
  // if (ACCEPTED_ORIGINS.includes(origin) || !origin) {
  //   res.header("Access-Control-Allow-Origin", origin);
  //   res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  // }

  const { id } = req.params;
  const movieIndex = movies.findIndex((movie) => movie.id === id);

  if (movieIndex === -1) {
    return res.status(404).json({ message: "Movie not found" });
  }
  movies.splice(movieIndex, 1);
  res.sendStatus(200);
});

//* Actualizar solo una pelicula
app.patch("/movies/:id", (req, res) => {
  const result = validatePartialMovie(req.body);
  console.log(result);
  if (!result.success) {
    return res.status(400).json({ error: JSON.parse(result.error.message) });
  }

  const { id } = req.params;
  const movieIndex = movies.findIndex((movie) => movie.id === id);

  if (movieIndex === -1) {
    return res.status(404).json({ message: "Movie not found" });
  }

  const updateMovie = {
    ...movies[movieIndex],
    ...result.data,
  };
  movies[movieIndex] = updateMovie;

  return res.json(updateMovie);
});

const PORT = process.env.PORT ?? 3002;

app.listen(PORT, () => {
  console.log(`server listening on port http://localhost:${PORT}`);
});
