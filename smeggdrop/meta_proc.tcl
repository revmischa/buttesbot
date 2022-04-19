 proc stacktrace {} {
      set stack "Stack trace:\n"
      for {set i 1} {$i < [info level]} {incr i} {
          set lvl [info level -$i]
          set pname [lindex $lvl 0]
          append stack [string repeat " " $i]$pname
          foreach value [lrange $lvl 1 end] arg [info args $pname] {
              if {$value eq ""} {
                  info default $pname $arg value
              }
              append stack " $arg='$value'"
          }
          append stack \n
      }
      return $stack
  }

namespace eval meta_proc {
  proc call {namespace name arguments commands} {
    set command [lindex $arguments 0]
    set arguments [lrange $arguments 1 end]
    if ![llength $commands] {
      set commands [lsort [namespace eval ::$namespace {info procs}]]
    }

    set usage [join [concat [lrange $commands 0 end-1] [list "or [lindex $commands end]"]] ", "]
    set matches [lsearch -all -inline -glob $commands $command*]

    if {$command eq ""} {
      error "wrong # of args: should be \"$name command ?arg arg ...?\"\n[::stacktrace]"
    } elseif {[llength $matches] == 0} {
      error "bad command \"$command\": must be $usage\n[::stacktrace]"
    } elseif {[llength $matches] > 1} {
      error "ambiguous command \"$command\": must be $usage"
    } else {
      set code [catch [concat [list ::${namespace}::[lindex $matches 0]] $arguments] result]
      if {$code && [regexp {^wrong # of args} $result]} {
        error [string map [list ::${namespace}:: "$name "] $result]
      } else {
        return -code $code $result
      }
    }
  }
}

proc meta_proc {name args} {
  if {[lindex $args 0] eq "-namespace"} {
    set namespace [lindex $args 1]
    set args [lrange $args 2 end]
  } else {
    set namespace $name
  }

  uplevel [list proc $name args "meta_proc::call [list $namespace] [list $name] \$args [list $args]"]
}
