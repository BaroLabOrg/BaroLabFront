FROM node:22-alpine AS build
WORKDIR /app

# Установка зависимостей
COPY package*.json ./
RUN npm install

# Копируем все файлы и билдим проект
COPY . .
RUN npm run build

# production image
FROM node:22-alpine AS prod
WORKDIR /app

# Устанавливаем только serve (зависимости для рантайма не нужны)
RUN npm install -g serve

# Копируем только статику
COPY --from=build /app/dist ./dist

# Экспонируем порт (по умолчанию serve слушает 3000, можно изменить)
EXPOSE 3000

# Запуск сервера
CMD ["serve", "-s", "dist", "-l", "3000"]
