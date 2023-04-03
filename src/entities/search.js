/**
 * Search function that retrieves search results from a search controller based on the given parameters.
 *
 * @param {Object} options - The input parameters for the search function.
 * @param {Object} options.req - The request object containing the parameters for the search (from and term).
 * @param {Object} options.db - The database object used to retrieve data.
 * @param {Object} options.searchCtrl - The search controller object used to perform the search.
 * @returns {Promise<Array>} - A Promise that resolves with an array of search results.
 * @throws {Error} - Throws an error if something goes wrong during the search process.
 */
const search = async ({ req, searchCtrl }) => {
    try {
        const { from, term } = req.params;
        if (!from || !term) return { status: 400, message: 'Bad request' };
        const { hits = [] } = await searchCtrl.search(from, { term });
        return hits.map(({ document }) => document);
    }
    catch (e) {
        console.log(e);
        throw new Error('Something went wrong')
    }
};

module.exports = search ;