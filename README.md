# Frontend App for CapRover

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Development

Run CapRover backend service in debug mode. Change `.env.development` to match your backend. Then run `yarn start`

> **Note**: To create a simple backend API in debug mode, you can use [Play with Docker](https://labs.play-with-docker.com/). Just simply run the following commands and you'll be set:
>
> ```bash
> apk update && apk add nodejs npm python3
> git clone https://github.com/caprover/caprover.git
> cd caprover
> npm i
> npm run clean
> echo "done"
> ```
>
> Then click on Open Port button and get the URL for port `3000`, it should be something like this (make sure to remove trailing slash): `http://ip172-18-0-76-abcdef123456-3000.direct.labs.play-with-docker.com`

We strive to keep CapRover code base consistent. This will ensure a high level of consistency and lower maintenance load.

### Available Scripts

In the project directory, you can run:

#### `yarn start`

Runs the app in the development mode.

Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.

You will also see any lint errors in the console.

### `yarn run build`

Builds the app for production to the `build` folder.

It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.

Your app is ready to be deployed!

## Theming

CapRover's fronted supports dark and light modes. It is based on `antd` colour schemes. Therefore, all used `antd` components within the project support both modes by default. However if we implement a custom component or want to change some global colors some steps needs to be considered.

### Implement Dark Mode in custom component

To ensure your elements work with both dark and light modes, following points needs to be considered:

-   **Don't use JSX inline styles for colors, use classNames instead and create rules within the `styles/style.less` or the according theme**
-   Use `antd` variables as `@layout-body-background, @body-background, @skeleton-color` for the colors.
    -   Use `@layout-body-background` for page backgrounds [`#f0f2f5`, `#000`]
    -   Use `@background-color-light` for log views or input areas [`#fafafa`, `rgba(255, 255, 255, 0.04)`]
    -   Use `@body-background` for elements within a card [`#fff`, `#000`]
    -   Use `@skeleton-color` for all border colors. [`#f2f2f2`, `#303030`]
-   Use the class `.inner-card` for nested cards, like the network stats.
-   If you need additional colors, that are present within an `antd` component, grab the according variable located in `~antd/lib/style/themes/default.less`

#### Dev Mode & Hot Reload

It can happen that modifying the `app.less` during `yarn run dev` leads to `FATAL ERROR: Ineffective mark-compacts near heap limit Allocation failed - JavaScript heap out of memory less`. To overcome this, we need to set `max-old-space-size`.

```bash
export NODE_OPTIONS="--max-old-space-size=8192"
```

### Global Variables

To add global less variables place them in `styles/vars.less`.

### Override Antd specific Variables

To override `antd` specific colors modify the according constant in `config-overrides.js` -> [`lightVars`, `darkVars`].

## Contribution

Thanks for contributing to the frontend code! Since contributors list for CapRover automatically picks up the contributors from the main backend repo, please make a minor update the frontend commit in the dockerfile, so your name will get displayed on the main page as a contributor.

https://github.com/caprover/caprover/blob/master/dockerfile-captain.release#L18

## Learn More

For more details and documentation, please visit [https://CapRover.com](https://caprover.com/)

## Backers

Thank you to all our backers! 🙏

![Contributors](https://contrib.rocks/image?repo=caprover/caprover-frontend)

[![Donate](https://opencollective.com/caprover/donate/button.png?color=blue)](https://opencollective.com/caprover#backer)
