# Builds astro.wasm, a WASI reactor module (no main: the host calls
# _initialize once, then the exports), from the untouched upstream sources in
# src/. Compiles inside the wasi-sdk docker image, so no local toolchain is
# needed.
#
#   make           build build/astro.wasm
#   make install   build, then copy it over ../../astro.wasm
#   make clean

# Functions the app can call. Everything else is hidden and stripped. To expose
# another swe_* function, add it here and to the Astro interface in
# src/lib/sweph.ts. malloc/free let the host allocate buffers in linear memory.
EXPORTS = swe_calc swe_calc_ut swe_utc_to_jd swe_houses_ex \
          swe_set_ephe_path swe_close malloc free

SRC = swedate.c swehouse.c swejpl.c swemmoon.c swemplan.c sweph.c \
      swephlib.c swecl.c swehel.c

# Pinned by digest so a rebuild does not silently pick up a new compiler.
WASI_IMAGE ?= ghcr.io/webassembly/wasi-sdk@sha256:52595085a0ffbaf574d8d678a9aa81305f0b3af81c639291f15bc7713e42848e
TARGET      = wasm32-wasip1
CFLAGS      = -O2 -flto -Wall -fvisibility=hidden
# TLSOFF: no __thread in single-threaded wasm; NO_SWE_GLP: WASI has no dladdr()
DEFS        = -DTLSOFF -DNO_SWE_GLP
LDFLAGS     = -mexec-model=reactor -Wl,--strip-all \
              $(addprefix -Wl$(comma)--export=,$(EXPORTS)) -lm
comma       = ,

OUT = build/astro.wasm

all: $(OUT)

# $CC is the wasi-sdk clang, preset by the image's environment.
$(OUT): $(addprefix src/,$(SRC)) $(wildcard src/*.h) Makefile
	mkdir -p build
	docker run --rm -u $$(id -u):$$(id -g) -v "$(CURDIR)":/work -w /work/src \
	  $(WASI_IMAGE) sh -c '"$$CC" --target=$(TARGET) $(CFLAGS) $(DEFS) \
	  -o ../$(OUT) $(SRC) $(LDFLAGS)'

install: $(OUT)
	cp $(OUT) ../../astro.wasm

clean:
	rm -rf build

.PHONY: all install clean
