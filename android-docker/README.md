# android-docker (resources only)

This directory provides resources used by the root-level Dockerfile:
- `android34/tools/` and `licenses/`: SDK bootstrap scripts and licenses
- `common/spoof/`: device spoof profiles and generator

It is not an independent build target. Please use the root `Dockerfile` to build the single runnable image:

```
docker build --platform linux/amd64 -t emuhub:0.1.0 .
docker run --platform linux/amd64 -it --rm -p 6080:6080 -p 5901:5901 -p 5555:5555 -e SPOOF_PROFILE=pixel_8_pro --name emuhub emuhub:0.1.0
```

