// Taken from https://github.com/aceakash/string-similarity

/*

MIT License

Copyright (c) 2018 Akash Kurdekar

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

*/

export default class StringSimilarity {
    static compareTwoStrings(first: string, second: string) {
        first = first.replace(/\s+/g, '')
        second = second.replace(/\s+/g, '')

        if (!first.length && !second.length) return 1 // if both are empty strings
        if (!first.length || !second.length) return 0 // if only one is empty string
        if (first === second) return 1 // identical
        if (first.length === 1 && second.length === 1) return 0 // both are 1-letter strings
        if (first.length < 2 || second.length < 2) return 0 // if either is a 1-letter string

        let firstBigrams = new Map()
        for (let i = 0; i < first.length - 1; i++) {
            const bigram = first.substring(i, i + 2)
            const count = firstBigrams.has(bigram)
                ? firstBigrams.get(bigram) + 1
                : 1

            firstBigrams.set(bigram, count)
        }

        let intersectionSize = 0
        for (let i = 0; i < second.length - 1; i++) {
            const bigram = second.substring(i, i + 2)
            const count = firstBigrams.has(bigram)
                ? firstBigrams.get(bigram)
                : 0

            if (count > 0) {
                firstBigrams.set(bigram, count - 1)
                intersectionSize++
            }
        }

        return (2.0 * intersectionSize) / (first.length + second.length - 2)
    }

    static findBestMatch(mainString: string, targetStrings: string) {
        if (!StringSimilarity.areArgsValid(mainString, targetStrings))
            throw new Error(
                'Bad arguments: First argument should be a string, second should be an array of strings'
            )

        const ratings = []
        let bestMatchIndex = 0

        for (let i = 0; i < targetStrings.length; i++) {
            const currentTargetString = targetStrings[i]
            const currentRating = StringSimilarity.compareTwoStrings(
                mainString,
                currentTargetString
            )
            ratings.push({ target: currentTargetString, rating: currentRating })
            if (currentRating > ratings[bestMatchIndex].rating) {
                bestMatchIndex = i
            }
        }

        const bestMatch = ratings[bestMatchIndex]

        return { ratings, bestMatch, bestMatchIndex }
    }

    private static areArgsValid(mainString: string, targetStrings: string) {
        if (typeof mainString !== 'string') return false
        if (!Array.isArray(targetStrings)) return false
        if (!targetStrings.length) return false
        if (targetStrings.find((s) => typeof s !== 'string')) return false
        return true
    }
}
