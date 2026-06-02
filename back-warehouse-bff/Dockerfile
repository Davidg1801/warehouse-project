FROM mcr.microsoft.com/dotnet/sdk:10.0
WORKDIR /app

COPY ZscalerRootCA.cer /usr/local/share/ca-certificates/ZscalerRootCA.crt
RUN update-ca-certificates

COPY *.csproj ./
RUN dotnet restore

COPY . .

EXPOSE 8080

CMD ["dotnet", "watch", "run", "--urls", "http://+:8080"]