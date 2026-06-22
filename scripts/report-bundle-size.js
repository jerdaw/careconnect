#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

// edited to work with the appdir by @raphaelbadia

const gzSize = require("gzip-size")
// const mkdirp = require("mkdirp")
const fs = require("fs")
const path = require("path")

// Pull options from `package.json`
const options = getOptions()
const BUILD_OUTPUT_DIRECTORY = getBuildOutputDirectory(options)

// first we check to make sure that the build output directory exists
const nextMetaRoot = path.join(process.cwd(), BUILD_OUTPUT_DIRECTORY)
try {
  fs.accessSync(nextMetaRoot, fs.constants.R_OK)
} catch (err) {
  console.error(
    `No build output found at "${nextMetaRoot}" - you may not have your working directory set correctly, or not have run "next build".`
  )
  process.exit(1)
}

// if so, we can import the build manifest
const buildMeta = require(path.join(nextMetaRoot, "build-manifest.json"))

// this memory cache ensures we dont read any script file more than once
// bundles are often shared between pages
const memoryCache = {}

// since _app is the template that all other pages are rendered into,
// every page must load its scripts. we'll measure its size here
const globalBundle = buildMeta.pages["/_app"]
const globalBundleSizes = getScriptSizes(globalBundle)

// next, we calculate the size of each page's scripts, after
// subtracting out the global scripts
const allPageSizes = Object.values(buildMeta.pages).reduce((acc, scriptPaths, i) => {
  const pagePath = Object.keys(buildMeta.pages)[i]
  const scriptSizes = getScriptSizes(scriptPaths.filter((scriptPath) => !globalBundle.includes(scriptPath)))

  acc[pagePath] = scriptSizes

  return acc
}, {})

const globalAppDirBundle = Array.from(
  new Set([...(buildMeta.polyfillFiles || []), ...(buildMeta.rootMainFiles || [])])
)
const globalAppDirBundleSizes = getScriptSizes(globalAppDirBundle)

const allAppDirSizes = getAppDirSizes(globalAppDirBundle)

// format and write the output
const rawData = JSON.stringify({
  ...allAppDirSizes,
  __global: globalAppDirBundleSizes,
})

// log ouputs to the gh actions panel
console.log(rawData)

// mkdirp.sync(path.join(nextMetaRoot, "analyze/"))
fs.mkdirSync(path.join(nextMetaRoot, "analyze/"), { recursive: true })
fs.writeFileSync(path.join(nextMetaRoot, "analyze/__bundle_analysis.json"), rawData)

// --------------
// Util Functions
// --------------

// given an array of scripts, return the total of their combined file sizes
function getScriptSizes(scriptPaths) {
  const existingScriptPaths = scriptPaths.filter((scriptPath) =>
    fs.existsSync(path.join(nextMetaRoot, scriptPath))
  )
  const res = existingScriptPaths.reduce(
    (acc, scriptPath) => {
      const [rawSize, gzipSize] = getScriptSize(scriptPath)
      acc.raw += rawSize
      acc.gzip += gzipSize

      return acc
    },
    { raw: 0, gzip: 0 }
  )

  return res
}

function getAppDirSizes(globalAppDirBundle) {
  const appBuildManifestPath = path.join(nextMetaRoot, "app-build-manifest.json")

  if (fs.existsSync(appBuildManifestPath)) {
    const appDirMeta = require(appBuildManifestPath)

    return Object.values(appDirMeta.pages).reduce((acc, scriptPaths, i) => {
      const pagePath = Object.keys(appDirMeta.pages)[i]
      const scriptSizes = getScriptSizes(
        scriptPaths.filter((scriptPath) => !globalAppDirBundle.includes(scriptPath))
      )
      acc[pagePath] = scriptSizes

      return acc
    }, {})
  }

  const appServerRoot = path.join(nextMetaRoot, "server/app")
  if (!fs.existsSync(appServerRoot)) {
    return {}
  }

  return findFiles(appServerRoot, "build-manifest.json").reduce((acc, manifestPath) => {
    const manifest = require(manifestPath)
    const routePath = getRoutePathFromManifestPath(appServerRoot, manifestPath)
    const scriptPaths = getManifestScriptPaths(manifest).filter(
      (scriptPath) => !globalAppDirBundle.includes(scriptPath)
    )

    acc[routePath] = getScriptSizes(scriptPaths)
    return acc
  }, {})
}

function getManifestScriptPaths(manifest) {
  return Array.from(
    new Set([
      ...(manifest.polyfillFiles || []),
      ...(manifest.rootMainFiles || []),
      ...(manifest.lowPriorityFiles || []),
      ...Object.values(manifest.pages || {}).flat(),
    ])
  )
}

function getRoutePathFromManifestPath(appServerRoot, manifestPath) {
  const relativeDirectory = path.relative(appServerRoot, path.dirname(manifestPath)).split(path.sep)
  const routeSegments = relativeDirectory.filter((segment) => segment !== "page" && segment !== "route")

  return `/${routeSegments.join("/")}`
}

function findFiles(directory, fileName) {
  const entries = fs.readdirSync(directory, { withFileTypes: true })

  return entries.flatMap((entry) => {
    const entryPath = path.join(directory, entry.name)

    if (entry.isDirectory()) {
      return findFiles(entryPath, fileName)
    }

    return entry.isFile() && entry.name === fileName ? [entryPath] : []
  })
}

// given an individual path to a script, return its file size
function getScriptSize(scriptPath) {
  const encoding = "utf8"
  const p = path.join(nextMetaRoot, scriptPath)

  let rawSize, gzipSize
  if (Object.keys(memoryCache).includes(p)) {
    rawSize = memoryCache[p][0]
    gzipSize = memoryCache[p][1]
  } else {
    const textContent = fs.readFileSync(p, encoding)
    rawSize = Buffer.byteLength(textContent, encoding)
    gzipSize = gzSize.sync(textContent)
    memoryCache[p] = [rawSize, gzipSize]
  }

  return [rawSize, gzipSize]
}

/**
 * Reads options from `package.json`
 */
function getOptions(pathPrefix = process.cwd()) {
  const pkg = require(path.join(pathPrefix, "package.json"))

  return { ...pkg.nextBundleAnalysis, name: pkg.name }
}

/**
 * Gets the output build directory, defaults to `.next`
 *
 * @param {object} options the options parsed from package.json.nextBundleAnalysis using `getOptions`
 * @returns {string}
 */
function getBuildOutputDirectory(options) {
  return options.buildOutputDirectory || ".next"
}
