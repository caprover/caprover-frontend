import { ThemeConfig } from 'antd'
import CapRoverTheme from './CapRoverTheme'

function evaluateExpression(expression: any, context: any) {
    try {
        // Use the Function constructor to create a new function that returns the evaluation of the expression
        // Note: The context is expanded to include commonly used JavaScript objects and functions for flexibility
        // eslint-disable-next-line no-new-func
        const func = new Function(
            'isDarkMode',
            'darkAlgorithm',
            'defaultAlgorithm',
            `return ${expression};`
        )
        return func(
            context.isDarkMode,
            context.darkAlgorithm,
            context.defaultAlgorithm
        )
    } catch (error) {
        // console.error('Error evaluating expression:', expression, error)
        return undefined
    }
}

// Recursive function to parse and interpret nested objects and strings
function parseObject(item: any, context: any) {
    if (typeof item === 'string') {
        // Check if string is an object expression by looking for '{' at any position (after whitespace)
        const trimmedItem = item.trim()
        if (trimmedItem.startsWith('{') && trimmedItem.endsWith('}')) {
            return evaluateExpression(`(${item})`, context) // Wrap in parentheses to ensure valid expression evaluation
        } else {
            return evaluateExpression(item, context)
        }
    } else if (typeof item === 'object' && item !== null) {
        // Recursively handle objects and arrays
        const result: any = Array.isArray(item) ? [] : {}
        for (const key in item) {
            result[key] = parseObject(item[key], context) as any
        }
        return result
    } else {
        // Return primitives as-is
        return item
    }
}

const ThemeParser = {
    parseTheme(
        currTheme: CapRoverTheme,
        isDarkMode: boolean,
        defaultAlgorithm: any,
        darkAlgorithm: any
    ): ThemeConfig | undefined {
        // Define the context for evaluations based on provided algorithms and mode
        const context = { isDarkMode, darkAlgorithm, defaultAlgorithm }

        // Start parsing the response object
        return parseObject(currTheme, context).content
    },
}

export default ThemeParser
