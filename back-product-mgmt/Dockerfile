FROM mcr.microsoft.com/dotnet/sdk:10.0
WORKDIR /app

COPY *.csproj ./
RUN dotnet restore

COPY . .

EXPOSE 8080

CMD ["dotnet", "watch", "run", "--urls", "http://+:8080"]