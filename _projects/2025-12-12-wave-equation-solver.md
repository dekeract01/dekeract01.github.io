---
title: "Wave Equation Solver Benchmarks"
excerpt: "Numerical methods, language/performance comparison across C++, Fortran, Rust, Python, Julia, MPI, OpenMP, and OpenCL."
collection: projects
date: 2025-12-12
permalink: /projects/wave-equation-solver/
---

I keep returning to a small one-dimensional wave solver. More precisely, it solves the linear advection equation,

$$
\frac{\partial \phi}{\partial t} = -c_0 \frac{\partial \phi}{\partial x}.
$$

It is not intended to be a comprehensive model of a physical system, nor is it the most demanding numerical problem I could choose. That is part of the appeal. I can understand the whole problem, derive its exact solution, and still exercise the pieces that make up a real numerical code: grids, boundary conditions, time integration, file output, verification, builds, and performance measurement.

The result is my [Wave Equation Benchmarks repository](https://github.com/dekeract01/wavebench): a continuing learning project rather than a claim that one programming language is universally faster than another.

## Why this equation?

For a periodic sine wave, the solution simply translates without changing shape:

$$
\phi(x,0) = \sin(2\pi x), \qquad
\phi_{\mathrm{exact}}(x,t) = \sin\left(2\pi(x-c_0t)\right).
$$

That exact solution is extremely useful. A timing alone cannot say whether a fast program is solving the right problem. Here I can compare every numerical result with the analytical answer and measure

$$
\max_x \left|\phi(x,t) - \phi_{\mathrm{exact}}(x,t)\right|.
$$

This makes the project a good place to experiment. When I add a new language, library, parallel model, GPU implementation, build system, or output format, I have a known problem and an accuracy check waiting for it. The equation is deliberately modest, but the software lessons are not.

## A deliberately familiar numerical method

I use a fourth-order central finite-difference approximation in space and a third-order Runge-Kutta method in time. This is a combination I knew from research work with [OpenSBLI](https://opensbli.github.io/), so it gives me a stable and recognisable starting point while I focus on the implementation details.

The benchmark domain is periodic, $0 \leq x < 1$, with $2{,}000{,}000$ grid points, wave speed $c_0 = 0.5$, a time step of $10^{-7}$, and 1,000 iterations. The CFL number is $0.1$. Periodicity makes the boundary condition straightforward, but it is still present in every version of the solver and therefore remains something to implement and test carefully.

There are methods better suited to particular applications. For example, problems with shocks or discontinuities need more care than a central scheme can provide. That is not what I am trying to learn here. I wanted a compact solver whose numerical ingredients were close to patterns I had used in research code, while being small enough to rewrite without losing sight of the whole calculation.

## One problem, several implementations

The repository currently contains serial C++, Fortran, Julia, Python, Python with Numba, and Rust versions, alongside OpenMP C++, MPI C++, MPI Fortran, and OpenCL C++ implementations. Keeping the numerical setup aligned lets me investigate practical questions instead of comparing unrelated programs:

- How does a language or compiler shape a simple array-based solver?
- What changes when work is shared between CPU threads, MPI ranks, or a GPU?
- How much do build configuration, floating-point precision, and output choices matter?
- Does the accelerated version still reproduce the analytical solution?

The CPU implementations use double precision. The OpenCL implementation currently uses single precision, which makes its error larger but is also a useful reminder that speed and precision are engineering choices, not afterthoughts.

## Running it on your machine

The benchmark is meant to be useful beyond my laptop. The quickest way to begin is to clone the repository, install the toolchains for the implementations you want to try, and run an individual directory. The C++, Fortran, OpenMP, MPI, OpenCL, and Rust directories use `make`; Julia and the Python variants run their source files directly.

For example, a C++ run is:

```bash
git clone https://github.com/dekeract01/wavebench.git
cd wavebench/cpp
make run
```

The root [`generate_all.py`](https://github.com/dekeract01/wavebench/blob/main/generate_all.py) script can build and run the configured suite in turn. It defaults to cleaning mode to make destructive cleanup explicit. To run the suite, edit `clean_setting` near the top of the script from `1` to `0`, then run:

```bash
python generate_all.py
python plot_wave.py
python plot_benchmarks.py
```

You do not need every compiler or runtime to use the repository. Start with one implementation that matches your installed tools, then add others as they become available. The plotting scripts need Python packages including NumPy, Matplotlib, and h5py. Most solvers write HDF5 files with the grid, numerical solution, analytical solution, and pointwise error; the shared plotting code also understands the older text and binary formats.

## Comparing results responsibly

The plots report time per iteration, iterations per second, and maximum error. They are useful for observing a particular machine and configuration, not for declaring universal language rankings. CPU architecture, compiler version and flags, library versions, thread and MPI-rank choices, GPU hardware, and numerical precision all affect the outcome.

### Performance results

![Performance comparison showing time per iteration and iterations per second](/images/result_benchmark_comparison.png)

### Accuracy results

![Maximum-error comparison across implementations](/images/result_benchmark_error.png)

On my 2021 14-inch MacBook Pro with an M1 Pro, the OpenCL version is the fastest current result because its kernels run on the integrated GPU. That does not translate directly to a discrete GPU or another CPU. The integrated GPU shares unified memory with the CPU, for example, so it does not incur the PCIe transfers that a discrete GPU normally would.

If you run the benchmarks, I would be very interested in how they behave on your machine. Please open a GitHub issue or discussion with the implementation and commit you used, your operating system and CPU/GPU, compiler or runtime versions, build flags, thread or MPI-rank count, precision, and the generated timing and error results. A short note about anything that did not build is just as valuable: portability problems are part of what this project is for.

## Where it goes next

I expect this repository to keep changing as I learn new tools. The value for me is not in finding a final winner. It is in having a numerical problem small enough to reimplement honestly, with an exact answer that keeps every experiment accountable.

The repository contains the current code, scripts, and benchmark details.
