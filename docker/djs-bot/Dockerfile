FROM node:20 as builder

RUN apt-get update -y && \
    apt-get install -y \
      build-essential \
      libpango1.0-dev \
      libcairo2-dev \
      librsvg2-dev \
      libjpeg-dev \
      libgif-dev \
      fonts-noto-cjk fonts-noto

# Configure default locale (important for chrome-headless-shell).
ENV LANG=en_US.UTF-8

RUN apt-get update \
  && apt-get install -y --no-install-recommends fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-khmeros \
  fonts-kacst fonts-freefont-ttf dbus dbus-x11

ENV DBUS_SESSION_BUS_ADDRESS autolaunch:
