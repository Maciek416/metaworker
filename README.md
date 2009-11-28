![mandelbrot](http://dl.dropbox.com/u/1149620/metaworker_mandelbrot.png)

metaworker
==========

metaworker is a simple library which helps in distributing computation work. It provides work distribution via HTML5 web workers and via server-side workers powered by nodejs. It allows you to use worker threads without worrying too much about the details of the worker spec. Some other convenience functions are provided. 

Implementation Notes
--------------------
 * metaworker is mostly experimental code that I am using to toy with web workers, nodejs, and distributed computing algorithms. The goal is to gradually evolve metaworker to support some of the same features and use cases as seen in MapReduce, however it does not distribute work in a compatible way.
 * Firefox's browser-side worker threads don't yet seem stable. metaworker has the capacity to crash Firefox fairly hard when using metaworker in browser-side worker mode. YMMV!

Included Files:
---------------

*   metaworker_example.html - This is a basic example showing the summation of an array of numbers shared amongst multiple workers.
*   fractal_example.html - An example that uses metaworker to render a mandelbrot fractal. **Note**: This example can be run in two ways, either with AJAX (server-side) workers or with browser (HTML5) workers.
*   dft_example.html - An example demonstrating metaworker being used to calculate a discrete Fourier transform (DFT).
*   metaworker_lib.js - The actual metaworker library.
*   metaworker.js - A worker bootstrap file used by metaworker_lib.js.
*   metaworker_server.js - A lightweight server-side worker intended for use with [node.js](http://nodejs.org/) .
