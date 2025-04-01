# 사용할 Node.js의 버전을 명시합니다.
FROM node:20

# 필요한 라이브러리 설치
RUN apt-get update && apt-get install -y \
  libnss3 \
  libatk-bridge2.0-0 \
  libx11-xcb1 \
  libxcb-dri3-0 \
  libxcomposite1 \
  libxdamage1 \
  libxrandr2 \
  libgbm1 \
  libasound2 \
  libpangocairo-1.0-0 \
  libgtk-3-0 \
  libxshmfence1 \
  libnss3-dev \
  libnspr4 \
  lsb-release \
  fonts-liberation \
  libappindicator3-1 \
  xdg-utils \
  wget \
  libgconf-2-4 \
  libxss1 \
  fonts-noto-cjk \
  fonts-noto-core \
  fonts-freefont-ttf

# 애플리케이션 디렉토리를 생성합니다.
WORKDIR /usr/src/app

# 애플리케이션 의존성 설치를 위한 파일들을 복사합니다.
# package.json 과 package-lock.json (if available)
COPY package*.json ./

# 패키지를 설치합니다.
RUN npm install

# # pm2를 글로벌로 설치합니다.
RUN npm install pm2 -g

# 애플리케이션 소스를 복사합니다.
COPY . .

# 애플리케이션이 사용할 포트를 명시합니다.
# EXPOSE 4000

# 애플리케이션을 Node.js로 직접 실행합니다.
# CMD ["node", "app.js"]

# # 애플리케이션을 pm2로 실행합니다.
CMD ["pm2-runtime", "start", "app.js"]
