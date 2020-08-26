export default {
    copyObject<T>(obj: T): T {
        return JSON.parse(JSON.stringify(obj)) as T
    },

    generateUuidV4() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(
            /[xy]/g,
            function (c) {
                let r = (Math.random() * 16) | 0,
                    v = c === 'x' ? r : (r & 0x3) | 0x8
                return v.toString(16)
            }
        )
    },

    deleteAllCookies() {
        let cookies = document.cookie.split(';')

        for (let i = 0; i < cookies.length; i++) {
            let cookie = cookies[i]
            let eqPos = cookie.indexOf('=')
            let name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie
            document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT'
        }
    },

    getAnsiColorRegex() {
        const pattern = [
            '[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:[a-zA-Z\\d]*(?:;[a-zA-Z\\d]*)*)?\\u0007)',
            '(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-ntqry=><~]))',
        ].join('|')

        return new RegExp(pattern, 'g')
    },

    isMobile() {
        return window.innerWidth < 768
    },

    isSafari() {
        let isSafari = false

        try {
            isSafari =
                /^((?!chrome|android).)*safari/i.test(navigator.userAgent) || //
                // eslint-disable-next-line
                !!navigator.userAgent.match(/Version\/[\d\.]+.*Safari/)
        } catch (error) {
            // Don't let the error ruin everything!
            console.log(error)
        }

        return isSafari
    },

    getDelayedPromise(time: number) {
        if (!time) return Promise.resolve()

        return new Promise<void>((res, rej) => {
            setTimeout(() => {
                res()
            }, time)
        })
    },

    createRandomStringHex(length: number) {
        let result = ''
        const characters = '0123456789abcdef'
        const charactersLength = characters.length
        for (let i = 0; i < length; i++) {
            result += characters.charAt(
                Math.floor(Math.random() * charactersLength)
            )
        }
        return result
    },

    replaceAllGenRandomForOneClickApp(inputString: string) {
        let matches

        while (
            (matches = /\$\$cap_gen_random_hex\((\d+)\)/g.exec(inputString)) &&
            matches.length === 2
        ) {
            const hexLength = Number(matches[1])
            if (hexLength > 256) {
                // capping out the maximum length to avoid unintentional problems
                inputString = inputString.replace(matches[0], '')
            } else {
                inputString = inputString.replace(
                    matches[0],
                    `${this.createRandomStringHex(hexLength)}`
                )
            }
        }

        return inputString
    },

    convertHexStringToUtf8(raw: string) {
        return !raw
            ? ''
            : decodeURIComponent(
                  raw
                      .substring(8, raw.length)
                      .replace(/\s+/g, '')
                      .replace(/[0-9a-f]{2}/g, '%$&')
              )
    },

    mergeObjects(object1: any, object2: any) {
        const newObject = object1 || {}
        object2 = object2 || {}

        Object.keys(object2).forEach((k) => {
            if (
                !newObject[k] ||
                Array.isArray(newObject[k]) ||
                Array.isArray(object2[k])
            ) {
                newObject[k] = object2[k]
            } else {
                if (
                    typeof object2[k] === 'object' &&
                    typeof newObject[k] === 'object'
                ) {
                    newObject[k] = this.mergeObjects(newObject[k], object2[k])
                } else {
                    newObject[k] = object2[k]
                }
            }
        })

        return newObject
    },
}
