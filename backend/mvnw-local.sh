#!/bin/bash
export JAVA_HOME=$(/usr/libexec/java_home -v 21)
exec mvn "$@"
