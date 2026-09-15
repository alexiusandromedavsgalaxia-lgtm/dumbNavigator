cmake_minimum_required(VERSION 3.16)
project(dumbNavigatorDesktop LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_RUNTIME_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/bin)

find_package(PkgConfig REQUIRED)
pkg_check_modules(GTK REQUIRED gtk+-3.0)

add_executable(dumbnavigator src/main.cpp)
target_include_directories(dumbnavigator PRIVATE ${GTK_INCLUDE_DIRS})
target_compile_options(dumbnavigator PRIVATE ${GTK_CFLAGS_OTHER} -Wall -Wextra -Wpedantic)
target_link_libraries(dumbnavigator PRIVATE ${GTK_LIBRARIES})

install(TARGETS dumbnavigator RUNTIME DESTINATION bin)
install(FILES resources/dumbnavigator.desktop DESTINATION share/applications)
install(FILES resources/dumbnavigator.svg DESTINATION share/icons/hicolor/scalable/apps)
install(FILES resources/dumbnavigator.1 DESTINATION share/man/man1)
