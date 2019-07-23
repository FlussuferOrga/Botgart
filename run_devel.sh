echo  -e "\033[33;5mWARNING! THIS SCRIPT IS NOT MEANT TO BE RUN IN A PRODUCTIVE ENVIRONMENT!\033[0m"
forever --watch --watchDirectory ./built/ built/index.js