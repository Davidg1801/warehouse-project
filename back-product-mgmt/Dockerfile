FROM mcr.microsoft.com/dotnet/sdk:10.0
WORKDIR /app

COPY ZscalerRootCA.cer /usr/local/share/ca-certificates/ZscalerRootCA.crt
RUN update-ca-certificates

COPY Worker/*.csproj ./Worker/
COPY Core/*.csproj ./Core/
COPY Infrastructure/*.csproj ./Infrastructure/
RUN dotnet restore "Worker/Worker.csproj"

COPY . .

WORKDIR /app/Worker

#EXPOSE 8080

CMD ["dotnet", "watch", "run", "--urls", "http://+:8080"]