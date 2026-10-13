FROM nginx:alpine
COPY . /usr/share/nginx/html
# Stamp each build into the CSS/JS links (index.html has ?v=__BUILD__) so
# browsers and Cloudflare fetch fresh files after every deploy instead of
# serving a cached stylesheet that no longer matches the new page.
RUN sed -i "s/__BUILD__/$(date +%s)/g" /usr/share/nginx/html/index.html
EXPOSE 80
