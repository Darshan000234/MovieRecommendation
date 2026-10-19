import { MovieService } from "./MovieService.js";
import { MovieController } from "./MovieController.js";

export class DemoApplication {
    static async main(embeddingModel) {
        const movieService = new MovieService(
            embeddingModel,
            JSON
        );

        await movieService.initializeMovies();

        return new MovieController(movieService);
    }
}