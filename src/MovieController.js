
export class MovieController {
    constructor(movieService){
        this.movieService = movieService;
    }

    async search(query){
        return this.movieService.search(query);
    }

    async similarMovies(title){
        return this.movieService.similarMovies(title);
    }
};

