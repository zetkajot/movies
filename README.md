# Simple Movie API
## Description
This app exposes simple REST API allowing for addition and filtered retrieval of movie records. All data is persisted in JSON file.
This project uses `nx` as a workspace manger/helper and `express`
## Running the app
After cloning the repo, install required dependencies via
```sh
yarn install
```
Then, create `.env` file based on provided `.env.template` and set value of `DB_FILE_PATH` to path to the JSON file containing movie records and genres definition (if using relative path, then it should be relative to the project root).
To start the app in development mode run
```sh
yarn nx run api:serve
```

In order to build the app and acquire bundled js file use
```sh
yarn nx run api:build:production
```
Resulting files will be then available in `dist` directory.

## Environmental Variables reference
In order to adjust behavior of the app, following env vars can be set:
| ENV            | Required?  | Description                                                             | Default   |
|----------------|------------|-------------------------------------------------------------------------|-----------|
| `APP_HOST`     | `false`    | address which app will bind to                                          | `0.0.0.0` |
| `APP_PORT`     | `false`    | port which app will listen to                                           | `0.0.0.0` |
| `DB_FILE_PATH` | `true`     | path to the JSON file containing movie records relative to project root | N/A       |

## API reference
### `GET /movies`
#### Query params
All query params are optional, but providing none of them will result in response containing only one movie.
| Name      | Type            | Description                                                                         | Example                |
|-----------|-----------------|-------------------------------------------------------------------------------------|------------------------|
| `runtime` | `number`        | Restricts response to records which have runtime in range `[runtime-10,runtime+10]` | `?runtime=120`         |
| `genres`  | `Array<string>` | Restricts response to records which are any of the given genres                     | `?genres=Drama,Comedy` |

When `genres` query param is used, records in response are sorted by the number of genres matched desc.

**IMPORTANT: Elements of `genres` must conform to predefined list of genres read from DB file at runtime**

#### Response body
Responds with an array of movie records with properties:
| Key         | Type                  | Description                                              | Example value                       |
|-------------|-----------------------|----------------------------------------------------------|-------------------------------------|
| `title`     | `string`              | Title of the movie                                       | `"Super movie 2"`                   |
| `year`      | `number`              | Year on which movie was released                         | `2021`                              |
| `runtime`   | `number`              | Runtime of the movie in minutes                          | `129`                               |
| `director`  | `string`              | Movie director(s)                                        | `"idk"`                             |
| `genres`    | `Array<string>`       | Array of predefined genres                               | `["Comedy", "Sci-Fi"]`              |
| `actors`    | `string \| undefined` | Optional list of actors in the form of contiguous string | `"John Doe, Janny Doe"`             |
| `plot`      | `string \| undefined` | Optional description of the movie's plot                 | `"Movie about me"`                  |
| `posterUrl` | `string \| undefined` | Optional link to the movie's poster                      | `"https://example.org/poster.jpeg"` |

Example request:
```
GET http://localhost:3000/movies?genres=Drama,Comedy&runtime=90
```

Example response:
```json
[
	{
		"title": "Mary and Max",
		"genres": [
			"Animation",
			"Comedy",
			"Drama"
		],
		"year": 2009,
		"runtime": 92,
		"director": "Adam Elliot",
		"actors": "Toni Collette, Philip Seymour Hoffman, Barry Humphries, Eric Bana",
		"plot": "A tale of friendship between two unlikely pen pals: Mary, a lonely, eight-year-old girl living in the suburbs of Melbourne, and Max, a forty-four-year old, severely obese man living in New York.",
		"posterUrl": "https://images-na.ssl-images-amazon.com/images/M/MV5BMTQ1NDIyNTA1Nl5BMl5BanBnXkFtZTcwMjc2Njk3OA@@._V1_SX300.jpg"
	},
	{
		"title": "The Artist",
		"genres": [
			"Comedy",
			"Drama",
			"Romance"
		],
		"year": 2011,
		"runtime": 100,
		"director": "Michel Hazanavicius",
		"actors": "Jean Dujardin, Bérénice Bejo, John Goodman, James Cromwell",
		"plot": "A silent movie star meets a young dancer, but the arrival of talking pictures sends their careers in opposite directions.",
		"posterUrl": "https://images-na.ssl-images-amazon.com/images/M/MV5BMzk0NzQxMTM0OV5BMl5BanBnXkFtZTcwMzU4MDYyNQ@@._V1_SX300.jpg"
	},
]
```

### `POST /movies`
#### Request Body
Request must be an with following properties:
| Key         | Type                  | Required? | Description                                              | Example value                       |
|-------------|-----------------------|-----------|----------------------------------------------------------|-------------------------------------|
| `title`     | `string`              | `true`    | Title of the movie                                       | `"Super movie 2"`                   |
| `year`      | `number`              | `true`    | Year on which movie was released                         | `2021`                              |
| `runtime`   | `number`              | `true`    | Runtime of the movie in minutes                          | `129`                               |
| `director`  | `string`              | `true`    | Movie director(s)                                        | `"idk"`                             |
| `genres`    | `Array<string>`       | `true`    | Array of predefined genres                               | `["Comedy", "Sci-Fi"]`              |
| `actors`    | `string`              | `false`   | Optional list of actors in the form of contiguous string | `"John Doe, Janny Doe"`             |
| `plot`      | `string`              | `false`   | Optional description of the movie's plot                 | `"Movie about me"`                  |
| `posterUrl` | `string`              | `false`   | Optional link to the movie's poster                      | `"https://example.org/poster.jpeg"` |

**IMPORTANT: Elements of `genres` must conform to predefined list of genres read from DB file at runtime**

#### Response body
Responds with a newly created movie record object with properties:
| Key         | Type                  | Description                                              | Example value                       |
|-------------|-----------------------|----------------------------------------------------------|-------------------------------------|
| `title`     | `string`              | Title of the movie                                       | `"Super movie 2"`                   |
| `year`      | `number`              | Year on which movie was released                         | `2021`                              |
| `runtime`   | `number`              | Runtime of the movie in minutes                          | `129`                               |
| `director`  | `string`              | Movie director(s)                                        | `"idk"`                             |
| `genres`    | `Array<string>`       | Array of predefined genres                               | `["Comedy", "Sci-Fi"]`              |
| `actors`    | `string \| undefined` | Optional list of actors in the form of contiguous string | `"John Doe, Janny Doe"`             |
| `plot`      | `string \| undefined` | Optional description of the movie's plot                 | `"Movie about me"`                  |
| `posterUrl` | `string \| undefined` | Optional link to the movie's poster                      | `"https://example.org/poster.jpeg"` |

Example request:
```
POST http://localhost:3000/movies?genres=Drama,Comedy&runtime=90
```
```json
{
	"title": "My super movie!",
	"runtime": 2137,
	"year": 2222,
	"genres": [
		"Comedy",
		"Film-Noir",
		"Horror",
		"War",
		"Sci-Fi"
	],
	"director": "Some unknown guy"
}
```

Example response:
```json
{
	"title": "My super movie!",
	"runtime": 2137,
	"year": 2222,
	"genres": [
		"Comedy",
		"Film-Noir",
		"Horror",
		"War",
		"Sci-Fi"
	],
	"director": "Some unknown guy"
}
```
## Errors
When query params and/or body do not match defined schema, API will respond with status code `400` and body matching:
```json
{
	"error": "400 - Bad Request",
	"message": "some description of error"
}
```
e.g.:
```json
{
	"error": "400 - Bad Request",
	"message": "Invalid request:\nFor properties 'runtime': Expected number, received nan"
}
```

In some other cases API can also respond with status code `500` and body: 
```json
{
	"error": "500 - Internal Server Error",
	"message": "Some error message"
}
```
