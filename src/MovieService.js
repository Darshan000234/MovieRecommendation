
import fs from "node:fs";
import path from "node:path";
import { Movie } from "./model/Movie.js";
import { MovieData } from "./model/MovieData.js";
import { MovieMatch } from "./model/MovieMatch.js";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class MovieService {
    constructor(embeddingModel, jsonMapper = JSON) {
        this.embeddingModel = embeddingModel;
        this.jsonMapper = jsonMapper;
        this.moviesEmbedding = [];
    }

    async initializeMovies() {
        const resource = path.join(
            __dirname,
            "resources",
            "movie.json"
        );

        const inputStream = fs.readFileSync(resource, "utf8");

        const movieDataList = this.jsonMapper.parse(inputStream).map(
            movieData => new MovieData(
                movieData.title,
                movieData.description
            )
        );

        for (const movieData of movieDataList) {
            const embedding = await this.embeddingModel.embed(
                movieData.getDescription()
            );

            const movie = new Movie(
                movieData.getTitle(),
                movieData.getDescription(),
                embedding
            );

            this.moviesEmbedding.push(movie);
        }

        console.log(
            `${this.moviesEmbedding.length} movies loaded with embeddings.`
        );
    }

    async search(query) {
        const userQueryEmbedding =
            await this.embeddingModel.embed(query);

        const matches = [];

        for (const movie of this.moviesEmbedding) {
            const similarity = this.cosineSimilarity(
                userQueryEmbedding,
                movie.getEmbedding()
            );

            matches.push(
                new MovieMatch(
                    movie.getTitle(),
                    movie.getDescription(),
                    similarity
                )
            );
        }

        this.sortBySimilarity(matches);
        return this.topKMatches(matches, 3);
    }

    async similarMovies(title) {
        const selectedMovie = this.findMovie(title);
        const matches = [];

        for (const movie of this.moviesEmbedding) {
            if (
                movie.getTitle().toLowerCase() ===
                title.toLowerCase()
            ) {
                continue;
            }

            const similarity = this.cosineSimilarity(
                selectedMovie.getEmbedding(),
                movie.getEmbedding()
            );

            const match = new MovieMatch(
                movie.getTitle(),
                movie.getDescription(),
                similarity
            );

            matches.push(match);
        }

        this.sortBySimilarity(matches);
        return this.topKMatches(matches, 3);
    }

    findMovie(title) {
        for (const movie of this.moviesEmbedding) {
            if (
                movie.getTitle().toLowerCase() ===
                title.toLowerCase()
            ) {
                return movie;
            }
        }

        throw new Error("Movie not found: " + title);
    }

    cosineSimilarity(a, b) {
        let dotProduct = 0;
        let normA = 0;
        let normB = 0;

        for (let i = 0; i < a.length; i++) {
            dotProduct += a[i] * b[i];
            normA += a[i] * a[i];
            normB += b[i] * b[i];
        }

        if (normA === 0 || normB === 0) {
            return 0;
        }

        return dotProduct /
            (Math.sqrt(normA) * Math.sqrt(normB));
    }

    sortBySimilarity(matches) {
        matches.sort(
            (first, second) =>
                second.getMatch() - first.getMatch()
        );
    }

    topKMatches(matches, limit) {
        const topMatches = [];
        const numberOfMatches = Math.min(
            limit,
            matches.length
        );

        for (let i = 0; i < numberOfMatches; i++) {
            topMatches.push(matches[i]);
        }

        return topMatches;
    }
}
