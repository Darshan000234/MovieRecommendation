
import express from "express";
import { DemoApplication } from "./DemoApplication.js";
import embeddingModel from "./embeddingModel.js";

const app = express();

app.use(express.json());

const movieController = await DemoApplication.main(embeddingModel);

app.get("/movies/search", async (req, res, next) => {
    try {
        const { query } = req.query;

        if (!query) {
            return res.status(400).json({
                error: "query is required"
            });
        }

        const result = await movieController.search(query);
        res.json(result);
    } catch (error) {
        next(error);
    }
}); 

app.get("/movies/:title/similar", async (req, res, next) => {
    try {
        const result = await movieController.similarMovies(
            req.params.title
        );

        res.json(result);
    } catch (error) {
        next(error);
    }
});

app.use((err, req, res, next) => {
    console.error(err.message);

    res.status(
        err.message.startsWith("Movie not found:") ? 404 : 500
    ).json({
        error: err.message
    });
});

const PORT = 8080;

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
